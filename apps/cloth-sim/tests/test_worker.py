from __future__ import annotations

import io
import json
import subprocess
import urllib.error
from pathlib import Path
from typing import Any

import pytest

from cloth_sim import worker as w

RENDER_ID = "7d0c3a52-8a51-4f53-9c1e-3c8f4f0b8e11"


def make_job(**overrides: Any) -> dict[str, Any]:
    job = {
        "renderId": RENDER_ID,
        "versionId": "version-1",
        "pose": "NEUTRE",
        "garmentType": "ROBE",
        "measurements": {"TOUR_POITRINE": 90},
        "fabricBehavior": "FLUIDE",
        "fit": {"primaryColor": "#123456"},
        "pieces": [{"name": "Devant"}],
        "timeoutSeconds": 600,
    }
    job.update(overrides)
    return job


def make_config(tmp_path: Path, **overrides: Any) -> w.WorkerConfig:
    values: dict[str, Any] = {
        "api_url": "http://api/api",
        "token": "secret",
        "blender": "/opt/blender/blender",
        "export_cmd": ("node", "cli.mjs", "export-job.ts"),
        "workdir": tmp_path,
    }
    values.update(overrides)
    return w.WorkerConfig(**values)


class FakeResponse(io.BytesIO):
    def __init__(self, body: bytes = b"", status: int = 200) -> None:
        super().__init__(body)
        self.status = status

    def __enter__(self) -> FakeResponse:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


class FakeOpener:
    """Records requests; answers from a list of (status, body) or raises."""

    def __init__(self, answers: list[Any]) -> None:
        self.answers = list(answers)
        self.requests: list[Any] = []

    def __call__(self, request: Any, timeout: float) -> FakeResponse:
        self.requests.append(request)
        answer = self.answers.pop(0)
        if isinstance(answer, BaseException):
            raise answer
        status, body = answer
        return FakeResponse(json.dumps(body).encode() if not isinstance(body, bytes) else body, status)


def envelope(data: Any) -> tuple[int, Any]:
    return 200, {"success": True, "data": data}


class FakeRunner:
    """Stands in for subprocess.run: writes what export-job.ts and simulate.py would write."""

    def __init__(
        self,
        *,
        export_rc: int = 0,
        sim_rc: int = 0,
        write_glb: bool = True,
        sim_timeout: bool = False,
        metrics: Any = None,
        job_json: Any = None,
    ) -> None:
        self.calls: list[dict[str, Any]] = []
        self.export_rc = export_rc
        self.sim_rc = sim_rc
        self.write_glb = write_glb
        self.sim_timeout = sim_timeout
        self.metrics = {"frames": 80} if metrics is None else metrics
        self.job_json = {"simPose": {"leftArm": {"raise": -7.5}}} if job_json is None else job_json

    def __call__(self, cmd: list[str], **kwargs: Any) -> subprocess.CompletedProcess[str]:
        self.calls.append({"cmd": cmd, **kwargs})
        if cmd[0] == "node":
            version = json.loads(Path(cmd[-3]).read_text())
            assert version["versionId"] == "version-1"
            if self.export_rc == 0:
                Path(cmd[-2]).write_text(
                    json.dumps(self.job_json) if not isinstance(self.job_json, str) else self.job_json
                )
            return subprocess.CompletedProcess(cmd, self.export_rc, "", "export boom" if self.export_rc else "")
        if self.sim_timeout:
            raise subprocess.TimeoutExpired(cmd, kwargs["timeout"])
        out = Path(cmd[cmd.index("--") + 2])
        if self.sim_rc == 0:
            if self.write_glb:
                (out / "garment.glb").write_bytes(b"glTF" + b"\0" * 60)
            (out / "metrics.json").write_text(
                self.metrics if isinstance(self.metrics, str) else json.dumps(self.metrics)
            )
        return subprocess.CompletedProcess(cmd, self.sim_rc, "", "line1\nTraceback: solver exploded")


# ----------------------------------------------------------------------------- config


def test_config_from_env(tmp_path: Path) -> None:
    config = w.WorkerConfig.from_env(
        {
            "CLOTH_SIM_API_URL": "http://api:3003/api/",
            "CLOTH_SIM_WORKER_TOKEN": " secret ",
            "BLENDER": "/opt/blender/blender",
            "CLOTH_SIM_EXPORT_CMD": "tsx /app/export-job.ts",
            "CLOTH_SIM_SIM_ARGS": "--frames 60 --no-petticoat",
            "CLOTH_SIM_POLL_S": "3",
            "CLOTH_SIM_TIMEOUT_S": "300",
            "CLOTH_SIM_WORKDIR": str(tmp_path),
            "CLOTH_SIM_KEEP_WORKDIR": "1",
        }
    )
    assert config.api_url == "http://api:3003/api"
    assert config.token == "secret"
    assert config.export_cmd == ("tsx", "/app/export-job.ts")
    assert config.sim_args == ("--frames", "60", "--no-petticoat")
    assert (config.poll_seconds, config.default_timeout, config.workdir, config.keep_workdir) == (
        3.0,
        300,
        tmp_path,
        True,
    )


def test_config_requires_api_and_token() -> None:
    with pytest.raises(ValueError):
        w.WorkerConfig.from_env({"CLOTH_SIM_API_URL": "http://api"})


def test_config_defaults() -> None:
    config = w.WorkerConfig.from_env({"CLOTH_SIM_API_URL": "http://api", "CLOTH_SIM_WORKER_TOKEN": "t"})
    assert config.blender.endswith("/blender")
    assert config.export_cmd[-1].endswith("tools/export-job.ts")
    assert config.workdir is None and config.sim_args == ()


def test_default_blender(tmp_path: Path) -> None:
    assert w.default_blender(tmp_path) == "blender"
    binary = tmp_path / ".blender/blender-4.5.14-linux-x64/blender"
    binary.parent.mkdir(parents=True)
    binary.write_text("")
    assert w.default_blender(tmp_path) == str(binary)


def test_default_export_cmd(tmp_path: Path) -> None:
    assert w.default_export_cmd(tmp_path)[0] == "tsx"
    cli = tmp_path / "node_modules/.pnpm/tsx@4.1.0/node_modules/tsx/dist/cli.mjs"
    cli.parent.mkdir(parents=True)
    cli.write_text("")
    assert w.default_export_cmd(tmp_path)[:2] == ("node", str(cli))


# ----------------------------------------------------------------------------- API client


def test_client_claim_unwraps_the_envelope_and_sends_the_token() -> None:
    opener = FakeOpener([envelope({"job": make_job()}), envelope({"job": None})])
    client = w.ApiClient("http://api/api/", "secret", opener=opener)

    assert client.claim()["renderId"] == RENDER_ID
    assert client.claim() is None
    request = opener.requests[0]
    assert request.full_url == "http://api/api/internal/cloth-sim/jobs/claim"
    assert request.get_method() == "POST"
    assert request.get_header("Authorization") == "Bearer secret"


def test_client_accepts_an_unwrapped_answer_and_reports() -> None:
    opener = FakeOpener([(200, {"uploadUrl": "u", "objectKey": "k"}), envelope({"ok": True}), envelope({"ok": True})])
    client = w.ApiClient("http://api", "t", opener=opener)
    assert client.upload_target(RENDER_ID) == {"uploadUrl": "u", "objectKey": "k"}
    client.done(RENDER_ID, {"objectKey": "k"})
    client.failed(RENDER_ID, "x" * 5000, None)
    assert opener.requests[1].full_url.endswith(f"/{RENDER_ID}/done")
    body = json.loads(opener.requests[2].data)
    assert len(body["error"]) == w.MAX_REASON and "durationMs" not in body


def test_client_raises_api_errors() -> None:
    error = urllib.error.HTTPError("http://api", 409, "Conflict", {}, io.BytesIO(b'{"message":"plus en cours"}'))  # type: ignore[arg-type]
    client = w.ApiClient("http://api", "t", opener=FakeOpener([error]))
    with pytest.raises(w.ApiError) as raised:
        client.done(RENDER_ID, {})
    assert raised.value.status == 409


def test_client_upload_puts_the_glb(tmp_path: Path) -> None:
    glb = tmp_path / "g.glb"
    glb.write_bytes(b"glTF")
    opener = FakeOpener([(200, b"")])
    w.ApiClient("http://api", "t", opener=opener).upload("http://minio/put?sig", glb)
    request = opener.requests[0]
    assert (request.get_method(), request.data, request.get_header("Content-type")) == (
        "PUT",
        b"glTF",
        "model/gltf-binary",
    )


def test_client_upload_refused(tmp_path: Path) -> None:
    glb = tmp_path / "g.glb"
    glb.write_bytes(b"glTF")
    error = urllib.error.HTTPError("http://minio", 403, "Forbidden", {}, io.BytesIO(b""))  # type: ignore[arg-type]
    with pytest.raises(w.JobFailure):
        w.ApiClient("http://api", "t", opener=FakeOpener([error])).upload("http://minio", glb)
    with pytest.raises(w.JobFailure):
        w.ApiClient("http://api", "t", opener=FakeOpener([(500, b"")])).upload("http://minio", glb)


# ----------------------------------------------------------------------------- one job


def test_version_dump_has_the_dump_version_shape() -> None:
    dump = w.version_dump(make_job(pieces=None))
    assert set(dump) == {"versionId", "garmentType", "measurements", "fabricBehavior", "fit", "pieces"}
    assert dump["pieces"] == []


def test_process_job_end_to_end(tmp_path: Path) -> None:
    runner = FakeRunner()
    opener = FakeOpener(
        [
            envelope({"uploadUrl": "http://minio/put", "objectKey": f"realistic-renders/{RENDER_ID}/a.glb"}),
            (200, b""),
            envelope({"ok": True}),
        ]
    )
    config = make_config(tmp_path, sim_args=("--frames", "60"))

    assert w.process_job(make_job(), w.ApiClient("http://api", "t", opener=opener), config, runner=runner) is True

    export, sim = runner.calls
    assert export["cmd"][:3] == ["node", "cli.mjs", "export-job.ts"] and export["cmd"][-1] == "NEUTRE"
    assert export["cwd"].endswith("apps/web")
    assert sim["cmd"][:3] == ["/opt/blender/blender", "-b", "-P"] and sim["cmd"][-2:] == ["--frames", "60"]
    assert 0 < sim["timeout"] <= 600
    done = json.loads(opener.requests[2].data)
    assert done["objectKey"] == f"realistic-renders/{RENDER_ID}/a.glb"
    assert done["sizeBytes"] == 64
    assert done["simPose"] == {"leftArm": {"raise": -7.5}}
    assert done["metrics"] == {"frames": 80}
    assert list(tmp_path.iterdir()) == []  # work dir removed


def test_process_job_keeps_the_workdir_on_request(tmp_path: Path) -> None:
    opener = FakeOpener(
        [envelope({"uploadUrl": "http://minio/put", "objectKey": "k"}), (200, b""), envelope({"ok": True})]
    )
    w.process_job(
        make_job(),
        w.ApiClient("http://api", "t", opener=opener),
        make_config(tmp_path, keep_workdir=True),
        runner=FakeRunner(metrics="not json", job_json="{broken"),
    )
    (workdir,) = tmp_path.iterdir()
    assert (workdir / "out" / "garment.glb").is_file()
    done = json.loads(opener.requests[2].data)
    assert done["metrics"] is None and done["simPose"] is None


@pytest.mark.parametrize(
    ("runner", "reason"),
    [
        (FakeRunner(export_rc=1), "export du job a échoué"),
        (FakeRunner(sim_rc=1), "solver exploded"),
        (FakeRunner(sim_timeout=True), "Délai de simulation dépassé"),
        (FakeRunner(write_glb=False), "aucun .glb"),
    ],
)
def test_process_job_reports_failures(tmp_path: Path, runner: FakeRunner, reason: str) -> None:
    opener = FakeOpener([envelope({"ok": True})])
    ok = w.process_job(make_job(), w.ApiClient("http://api", "t", opener=opener), make_config(tmp_path), runner=runner)
    assert ok is False
    request = opener.requests[0]
    assert request.full_url.endswith(f"/{RENDER_ID}/failed")
    body = json.loads(request.data)
    assert reason in body["error"] and body["durationMs"] >= 0


def test_process_job_reports_a_missing_binary(tmp_path: Path) -> None:
    def runner(cmd: list[str], **_: Any) -> subprocess.CompletedProcess[str]:
        raise FileNotFoundError(cmd[0])

    opener = FakeOpener([envelope({"ok": True})])
    w.process_job(make_job(), w.ApiClient("http://api", "t", opener=opener), make_config(tmp_path), runner=runner)
    assert "impossible de lancer node" in json.loads(opener.requests[0].data)["error"]


def test_process_job_shares_one_time_budget(tmp_path: Path) -> None:
    ticks = iter([0.0, 0.0, 0.0, 700.0, 700.0, 700.0, 700.0])
    opener = FakeOpener([envelope({"ok": True})])
    runner = FakeRunner()
    w.process_job(
        make_job(timeoutSeconds=600),
        w.ApiClient("http://api", "t", opener=opener),
        make_config(tmp_path),
        runner=runner,
        clock=lambda: next(ticks),
    )
    assert len(runner.calls) == 1  # Blender never started: the export used the whole budget
    assert "avant l'étape « simulation Blender »" in json.loads(opener.requests[0].data)["error"]


def test_process_job_survives_an_unexpected_error_and_an_unreachable_api(tmp_path: Path) -> None:
    def runner(cmd: list[str], **_: Any) -> subprocess.CompletedProcess[str]:
        raise RuntimeError("disk full")

    opener = FakeOpener([OSError("connection refused")])
    ok = w.process_job(make_job(), w.ApiClient("http://api", "t", opener=opener), make_config(tmp_path), runner=runner)
    assert ok is False


# ----------------------------------------------------------------------------- loop


def test_worker_runs_jobs_until_the_queue_is_empty(tmp_path: Path) -> None:
    opener = FakeOpener(
        [
            envelope({"job": make_job()}),
            envelope({"uploadUrl": "http://minio/put", "objectKey": "k"}),
            (200, b""),
            envelope({"ok": True}),
            envelope({"job": None}),
        ]
    )
    worker = w.Worker(make_config(tmp_path), client=w.ApiClient("http://api", "t", opener=opener), runner=FakeRunner())
    assert worker.run(max_jobs=5) == 1


def test_worker_sleeps_on_an_empty_queue_and_stops_on_signal(tmp_path: Path) -> None:
    opener = FakeOpener([envelope({"job": None}), OSError("api down")])
    sleeps: list[float] = []

    def sleep(seconds: float) -> None:
        sleeps.append(seconds)
        if len(sleeps) == 2:
            worker.stop()

    worker = w.Worker(
        make_config(tmp_path, poll_seconds=7), client=w.ApiClient("http://api", "t", opener=opener), sleep=sleep
    )
    assert worker.run() == 0
    assert sleeps == [7, 7]


def test_worker_builds_its_client_from_the_config(tmp_path: Path) -> None:
    worker = w.Worker(make_config(tmp_path))
    assert worker.client.base_url == "http://api/api" and worker.client.token == "secret"
