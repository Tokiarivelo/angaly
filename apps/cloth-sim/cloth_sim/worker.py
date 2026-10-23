"""Cloth-sim worker: takes realistic-render jobs from the API, simulates them in Blender, uploads the `.glb`.

Loop (docs/features/realistic-render-blender.md §3):
  1. ``POST /internal/cloth-sim/jobs/claim``      → the oldest queued render (version pieces, measurements, fabric)
  2. ``tools/export-job.ts``                       → job.json (draped panels + fitted, posed body; ``simPose``)
  3. ``blender -b -P scripts/simulate.py``         → garment.glb + metrics.json (killed past the timeout)
  4. ``POST …/upload-target`` then HTTP PUT       → the `.glb` in MinIO (presigned URL: no MinIO credentials here)
  5. ``POST …/done`` (or ``…/failed`` + reason)

Standard library only: this runs in the container's system Python, not in Blender's. One job at a time per process
(``CLOTH_SIM_CONCURRENCY`` = number of containers). Run with ``python -m cloth_sim.worker``.
"""

from __future__ import annotations

import json
import logging
import os
import shlex
import shutil
import signal
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

log = logging.getLogger("cloth_sim.worker")

APP_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = APP_DIR.parent.parent
WEB_DIR = REPO_DIR / "apps" / "web"

#: Keep the reason short: it is stored and shown to the customer.
MAX_REASON = 1000


class ApiError(RuntimeError):
    """The API answered with an error status."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(f"API {status}: {message}")
        self.status = status


class JobFailure(RuntimeError):
    """The job cannot be rendered (export, Blender or upload failed). The message is the reason sent to the API."""


@dataclass(frozen=True)
class WorkerConfig:
    api_url: str
    token: str
    blender: str
    export_cmd: tuple[str, ...]
    sim_args: tuple[str, ...] = ()
    poll_seconds: float = 10.0
    default_timeout: int = 600
    workdir: Path | None = None
    keep_workdir: bool = False

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> WorkerConfig:
        env = dict(os.environ if env is None else env)
        api_url = env.get("CLOTH_SIM_API_URL", "").rstrip("/")
        token = env.get("CLOTH_SIM_WORKER_TOKEN", "").strip()
        if not api_url or not token:
            raise ValueError("CLOTH_SIM_API_URL and CLOTH_SIM_WORKER_TOKEN are required")
        workdir = env.get("CLOTH_SIM_WORKDIR")
        return cls(
            api_url=api_url,
            token=token,
            blender=env.get("BLENDER") or default_blender(),
            export_cmd=tuple(shlex.split(env["CLOTH_SIM_EXPORT_CMD"]))
            if env.get("CLOTH_SIM_EXPORT_CMD")
            else default_export_cmd(),
            sim_args=tuple(shlex.split(env.get("CLOTH_SIM_SIM_ARGS", ""))),
            poll_seconds=float(env.get("CLOTH_SIM_POLL_S") or 10),
            default_timeout=int(env.get("CLOTH_SIM_TIMEOUT_S") or 600),
            workdir=Path(workdir) if workdir else None,
            keep_workdir=env.get("CLOTH_SIM_KEEP_WORKDIR", "") in {"1", "true", "yes"},
        )


def default_blender(app: Path = APP_DIR) -> str:
    """The Blender of ``make install.blender`` (``.blender/blender-<version>-linux-x64/blender``), else ``blender``."""
    found = sorted(app.glob(".blender/blender-*-linux-x64/blender"))
    return str(found[-1]) if found else "blender"


def default_export_cmd(repo: Path = REPO_DIR) -> tuple[str, ...]:
    """``node <tsx cli> tools/export-job.ts``, with the tsx of the pnpm store (as ``make job.cloth``), else ``tsx``."""
    script = str(APP_DIR / "tools" / "export-job.ts")
    clis = sorted(repo.glob("node_modules/.pnpm/tsx@*/node_modules/tsx/dist/cli.mjs"))
    return ("node", str(clis[-1]), script) if clis else ("tsx", script)


# --------------------------------------------------------------------------- HTTP

Opener = Callable[[urllib.request.Request, float], Any]


def _default_opener(request: urllib.request.Request, timeout: float) -> Any:
    return urllib.request.urlopen(request, timeout=timeout)  # noqa: S310 — URLs come from our own config/API


class ApiClient:
    """The worker's side of /internal/cloth-sim (the API wraps every answer in ``{success, data}``)."""

    def __init__(self, base_url: str, token: str, opener: Opener = _default_opener, timeout: float = 30) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.opener = opener
        self.timeout = timeout

    def _post(self, path: str, body: dict[str, Any] | None = None) -> Any:
        data = json.dumps(body or {}).encode()
        request = urllib.request.Request(
            f"{self.base_url}/internal/cloth-sim/jobs/{path}",
            data=data,
            method="POST",
            headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
        )
        try:
            with self.opener(request, self.timeout) as response:
                payload = json.loads(response.read() or b"null")
        except urllib.error.HTTPError as error:
            raise ApiError(error.code, error.read().decode(errors="replace")[:300]) from error
        if isinstance(payload, dict) and "success" in payload and "data" in payload:
            return payload["data"]
        return payload

    def claim(self) -> dict[str, Any] | None:
        answer = self._post("claim")
        return answer.get("job") if isinstance(answer, dict) else None

    def upload_target(self, render_id: str) -> dict[str, Any]:
        return self._post(f"{render_id}/upload-target")

    def done(self, render_id: str, report: dict[str, Any]) -> None:
        self._post(f"{render_id}/done", report)

    def failed(self, render_id: str, reason: str, duration_ms: int | None) -> None:
        body: dict[str, Any] = {"error": reason[:MAX_REASON] or "Erreur inconnue"}
        if duration_ms is not None:
            body["durationMs"] = duration_ms
        self._post(f"{render_id}/failed", body)

    def upload(self, url: str, path: Path) -> None:
        """PUT the file to the presigned MinIO URL."""
        data = path.read_bytes()
        request = urllib.request.Request(url, data=data, method="PUT", headers={"Content-Type": "model/gltf-binary"})
        try:
            with self.opener(request, max(self.timeout, 120)) as response:
                status = getattr(response, "status", 200)
        except urllib.error.HTTPError as error:
            raise JobFailure(f"Dépôt du .glb refusé par le stockage ({error.code}).") from error
        if status >= 300:
            raise JobFailure(f"Dépôt du .glb refusé par le stockage ({status}).")


# --------------------------------------------------------------------------- one job

Runner = Callable[..., subprocess.CompletedProcess[str]]


def _tail(text: str | None, lines: int = 8) -> str:
    return "\n".join((text or "").strip().splitlines()[-lines:])


def version_dump(job: dict[str, Any]) -> dict[str, Any]:
    """The job in the shape tools/export-job.ts reads (same as scripts/dump-version.sh)."""
    return {
        "versionId": job["versionId"],
        "garmentType": job["garmentType"],
        "measurements": job.get("measurements"),
        "fabricBehavior": job.get("fabricBehavior"),
        "fit": job.get("fit"),
        "pieces": job.get("pieces") or [],
    }


def _run(runner: Runner, cmd: Sequence[str], timeout: float, what: str, cwd: Path) -> None:
    if timeout <= 0:
        raise JobFailure(f"Délai de simulation dépassé avant l'étape « {what} ».")
    try:
        result = runner(list(cmd), cwd=str(cwd), capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as error:
        raise JobFailure(f"Délai de simulation dépassé ({what}, {int(timeout)} s).") from error
    except OSError as error:
        raise JobFailure(f"{what} : impossible de lancer {cmd[0]} ({error}).") from error
    if result.returncode != 0:
        raise JobFailure(f"{what} a échoué (code {result.returncode}) : {_tail(result.stderr or result.stdout)}")


@dataclass
class JobResult:
    glb: Path
    sim_pose: dict[str, Any] | None
    metrics: dict[str, Any] | None
    workdir: Path = field(repr=False)


def simulate(
    job: dict[str, Any],
    config: WorkerConfig,
    workdir: Path,
    runner: Runner = subprocess.run,
    clock: Callable[[], float] = time.monotonic,
) -> JobResult:
    """Export the job, simulate it. Both steps share the job's time budget."""
    deadline = clock() + int(job.get("timeoutSeconds") or config.default_timeout)
    version_path = workdir / "version.json"
    job_path = workdir / "job.json"
    out = workdir / "out"
    out.mkdir(parents=True, exist_ok=True)
    version_path.write_text(json.dumps(version_dump(job)))

    pose = str(job.get("pose") or "PRESENTATION")
    # From apps/web: export-job.ts reuses the viewer's code and resolves its packages from there.
    _run(
        runner,
        [*config.export_cmd, str(version_path), str(job_path), pose],
        deadline - clock(),
        "export du job",
        WEB_DIR,
    )
    simulate_py = APP_DIR / "scripts" / "simulate.py"
    _run(
        runner,
        [config.blender, "-b", "-P", str(simulate_py), "--", str(job_path), str(out), *config.sim_args],
        deadline - clock(),
        "simulation Blender",
        REPO_DIR,
    )

    glb = out / "garment.glb"
    if not glb.is_file() or glb.stat().st_size == 0:
        raise JobFailure("La simulation n'a produit aucun .glb.")

    sim_pose: dict[str, Any] | None = None
    try:
        exported = json.loads(job_path.read_text())
        sim_pose = exported.get("simPose") if isinstance(exported.get("simPose"), dict) else None
    except (OSError, ValueError):
        sim_pose = None
    metrics: dict[str, Any] | None = None
    try:
        loaded = json.loads((out / "metrics.json").read_text())
        metrics = loaded if isinstance(loaded, dict) else None
    except (OSError, ValueError):
        metrics = None
    return JobResult(glb=glb, sim_pose=sim_pose, metrics=metrics, workdir=workdir)


def process_job(
    job: dict[str, Any],
    client: ApiClient,
    config: WorkerConfig,
    runner: Runner = subprocess.run,
    clock: Callable[[], float] = time.monotonic,
) -> bool:
    """Run one claimed job to its end and report it. True when DONE."""
    render_id = str(job["renderId"])
    started = clock()
    workdir = Path(tempfile.mkdtemp(prefix=f"render-{render_id[:8]}-", dir=config.workdir))
    elapsed_ms = lambda: int((clock() - started) * 1000)  # noqa: E731
    try:
        result = simulate(job, config, workdir, runner=runner, clock=clock)
        target = client.upload_target(render_id)
        client.upload(str(target["uploadUrl"]), result.glb)
        client.done(
            render_id,
            {
                "objectKey": target["objectKey"],
                "sizeBytes": result.glb.stat().st_size,
                "durationMs": elapsed_ms(),
                "simPose": result.sim_pose,
                "metrics": result.metrics,
            },
        )
        log.info("render %s done in %.0f s", render_id, clock() - started)
        return True
    except JobFailure as failure:
        log.warning("render %s failed: %s", render_id, failure)
        _report_failure(client, render_id, str(failure), elapsed_ms())
        return False
    except Exception as error:  # noqa: BLE001 — anything else still ends the job as FAILED
        log.exception("render %s crashed", render_id)
        _report_failure(client, render_id, f"Erreur du worker : {error}", elapsed_ms())
        return False
    finally:
        if not config.keep_workdir:
            shutil.rmtree(workdir, ignore_errors=True)


def _report_failure(client: ApiClient, render_id: str, reason: str, duration_ms: int) -> None:
    try:
        client.failed(render_id, reason, duration_ms)
    except (ApiError, OSError) as error:
        # The job stays RUNNING; the API gives it back once it is stale (CLOTH_SIM_TIMEOUT_S + 2 min).
        log.error("could not report the failure of %s: %s", render_id, error)


# --------------------------------------------------------------------------- loop


class Worker:
    def __init__(
        self,
        config: WorkerConfig,
        client: ApiClient | None = None,
        runner: Runner = subprocess.run,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self.config = config
        self.client = client or ApiClient(config.api_url, config.token)
        self.runner = runner
        self.sleep = sleep
        self.stopping = False

    def stop(self, *_: object) -> None:
        """SIGTERM/SIGINT: finish the current job, then exit."""
        self.stopping = True

    def run_once(self) -> bool | None:
        """Claim and run one job. None when the queue was empty or the API unreachable."""
        try:
            job = self.client.claim()
        except (ApiError, OSError) as error:
            log.warning("claim failed: %s", error)
            return None
        if not job:
            return None
        return process_job(job, self.client, self.config, runner=self.runner)

    def run(self, max_jobs: int | None = None) -> int:
        done = 0
        while not self.stopping and (max_jobs is None or done < max_jobs):
            outcome = self.run_once()
            if outcome is None:
                if max_jobs is not None:
                    break
                self.sleep(self.config.poll_seconds)
                continue
            done += 1
        return done


def main() -> None:  # pragma: no cover — process entry point
    logging.basicConfig(
        level=os.environ.get("CLOTH_SIM_LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s"
    )
    worker = Worker(WorkerConfig.from_env())
    signal.signal(signal.SIGTERM, worker.stop)
    signal.signal(signal.SIGINT, worker.stop)
    once = os.environ.get("CLOTH_SIM_ONCE", "") in {"1", "true", "yes"}
    log.info("cloth-sim worker polling %s", worker.config.api_url)
    worker.run(max_jobs=1 if once else None)


if __name__ == "__main__":  # pragma: no cover
    main()
