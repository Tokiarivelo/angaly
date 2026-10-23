"""Fabric calibration (phase 4 of docs/features/realistic-render-blender.md): simulate bench dresses with variants of
the cloth settings and compare the settled silhouette (hem ÷ waist) with the one read off their photo
(`fullness.skirt`).

    .venv/bin/python scripts/calibrate_fabrics.py cases.json OUT_DIR
        [--variant name:field=value,field=value …] [--threads 4] [--frames 80]

cases.json: [{"name": "met-005", "versionId": "<uuid>", "target": 3.0}, …] (dev Postgres, `scripts/dump-version.sh`).
Each job is exported once (OUT_DIR/<name>/job.json) and simulated per variant without export or picture; results are
appended to OUT_DIR/results.jsonl (one line per run, so an interrupted run resumes) and summed up in OUT_DIR/summary.md.
A variant `base` (no override) is always run first.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP))

from cloth_sim.checks import silhouette  # noqa: E402
from cloth_sim.job import Body, Panel, load_job  # noqa: E402
from cloth_sim.prepare import prepare  # noqa: E402
from cloth_sim.worker import WEB_DIR, default_blender, default_export_cmd  # noqa: E402


def parse_variant(text: str) -> tuple[str, list[str]]:
    """`soft:bending=1,mass=0.2` → ("soft", ["--set", "bending=1", "--set", "mass=0.2"]); an item starting with `--` is
    passed to simulate.py as is (`bare:--no-petticoat`, `sup5:--support=5`)."""
    name, _, sets = text.partition(":")
    args: list[str] = []
    for item in filter(None, sets.split(",")):
        if item.startswith("--"):
            args += item.split("=", 1)
            continue
        if "=" not in item:
            raise ValueError(f"variant {name}: '{item}' is not field=value")
        args += ["--set", item]
    return name, args


def run(cmd: list[str], cwd: Path, log: Path) -> None:
    with log.open("a") as out:
        out.write(f"$ {' '.join(cmd)}\n")
        out.flush()
        subprocess.run(cmd, cwd=cwd, stdout=out, stderr=subprocess.STDOUT, check=True)


def split(panels: list[Panel], offsets, positions) -> list[Panel]:
    """The prepared panels at the positions of a frame (same split as `simulate.with_positions`)."""
    return [
        Panel(
            id=p.id,
            zone=p.zone,
            role=p.role,
            positions=positions[offsets[i] : offsets[i + 1]],
            indices=p.indices,
            uvs=p.uvs,
        )
        for i, p in enumerate(panels)
    ]


def remeasure(job_path: Path, run_dir: Path) -> tuple[dict | None, dict | None]:
    """Silhouettes before and after a finished run, from the job and `settled.npy` (no new simulation): the job is
    prepared again (deterministic), so the settled cloth splits into the same panels."""
    import numpy as np

    job = load_job(job_path)
    prep = prepare(job)
    settled = np.load(run_dir / "settled.npy")
    final = Body(positions=job.body.final, indices=job.body.indices, arm_weights=job.body.arm_weights)
    before = silhouette(split(prep.panels, prep.cloth.offsets, prep.cloth.positions), job.body)
    after = silhouette(split(prep.panels, prep.cloth.offsets, settled), final)
    return before, after


def summary_rows(results: list[dict]) -> list[str]:
    rows = [
        "| Robe | Tissu | Cible | Drapé | Variante | Simulé | Écart | Ourlet ↓ mm | Sous le sol | Bras nu | s/image |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in results:
        after = r.get("after") or {}
        before = r.get("before") or {}
        sim = (after.get("silhouette") or {}).get("ratio")
        drape = (before.get("silhouette") or {}).get("ratio")
        gap = f"{sim - r['target']:+.2f}" if sim is not None and r.get("target") else "—"
        bare = after.get("bareArm")
        rows.append(
            f"| {r['name']} | {r.get('fabric', '—')} | {r.get('target', '—')} | {drape if drape is not None else '—'} "
            f"| {r['variant']} | {sim if sim is not None else '—'} | {gap} | {after.get('hemDropMm', '—')} "
            f"| {after.get('underFloor', '—')} | {'—' if bare is None else f'{bare:.1%}'} "
            f"| {r.get('secondsPerFrame', '—')} |"
        )
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cases")
    ap.add_argument("out")
    ap.add_argument("--variant", action="append", default=[])
    ap.add_argument("--threads", type=int, default=4, help="Blender threads (leave CPU to the rest of the machine)")
    ap.add_argument("--frames", type=int, default=80)
    ap.add_argument("--pose", default="PRESENTATION")
    ap.add_argument("--remeasure", action="store_true", help="recompute the silhouettes of finished runs, then exit")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    cases = json.loads(Path(args.cases).read_text())
    variants = [("base", [])] + [parse_variant(v) for v in args.variant]
    results_path = out / "results.jsonl"
    done = set()
    results: list[dict] = []
    if results_path.exists():
        for line in results_path.read_text().splitlines():
            r = json.loads(line)
            results.append(r)
            done.add((r["name"], r["variant"]))

    if args.remeasure:
        for r in results:
            before, after = remeasure(out / r["name"] / "job.json", out / r["name"] / r["variant"])
            r.setdefault("before", {})["silhouette"] = before
            r.setdefault("after", {})["silhouette"] = after
        results_path.write_text("".join(json.dumps(r) + "\n" for r in results))
        (out / "summary.md").write_text("\n".join(summary_rows(results)) + "\n")
        print((out / "summary.md").read_text())
        return

    blender = default_blender()
    for case in cases:
        name = case["name"]
        work = out / name
        work.mkdir(exist_ok=True)
        log = work / "log.txt"
        job = work / "job.json"
        if not job.exists():
            version = work / "version.json"
            run([str(APP / "scripts" / "dump-version.sh"), case["versionId"], str(version)], APP, log)
            run([*default_export_cmd(), str(version), str(job), args.pose], WEB_DIR, log)
        fabric = json.loads(job.read_text()).get("fabric", {}).get("behavior")
        for variant, sets in variants:
            if (name, variant) in done:
                continue
            run_dir = work / variant
            run_dir.mkdir(exist_ok=True)
            t = time.perf_counter()
            run(
                [
                    blender,
                    "-b",
                    "-t",
                    str(args.threads),
                    "-P",
                    str(APP / "scripts" / "simulate.py"),
                    "--",
                    str(job),
                    str(run_dir),
                    "--no-export",
                    "--frames",
                    str(args.frames),
                    *sets,
                ],
                APP,
                log,
            )
            metrics = json.loads((run_dir / "metrics.json").read_text())
            result = {
                "name": name,
                "variant": variant,
                "sets": sets[1::2],
                "target": case.get("target"),
                "fabric": fabric,
                "before": metrics.get("before"),
                "after": metrics.get("after"),
                "secondsPerFrame": metrics.get("secondsPerFrame"),
                "wallSeconds": round(time.perf_counter() - t, 1),
            }
            with results_path.open("a") as f:
                f.write(json.dumps(result) + "\n")
            results.append(result)
            print(summary_rows([result])[-1], flush=True)

    (out / "summary.md").write_text("\n".join(summary_rows(results)) + "\n")


if __name__ == "__main__":
    main()
