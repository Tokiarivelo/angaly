"""`python -m app.evaluation` — reproducible evaluation report (used by `make eval.photo`).

Two ways to get predictions:
  --predictions FILE   JSONL {id, profile|null, raw?, latencyMs?} produced earlier (offline, CI)
  --images DIR         run `analyze_inspiration` on each image (needs provider credentials)
Always writes `report.md` + `report.json` into --out."""
from __future__ import annotations

import argparse
import base64
import json
import sys
import time
from pathlib import Path
from typing import Any

from app.evaluation.manifest import ManifestEntry, load_manifest
from app.evaluation.metrics import Sample, compute_metrics
from app.evaluation.report import Finding, check_regressions, check_thresholds, render_markdown

DATA_DIR = Path(__file__).resolve().parents[2] / "ml" / "data" / "eval"


def load_predictions(path: Path) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            out[row["id"]] = row
    return out


def predict_live(entries: list[ManifestEntry], images: Path) -> dict[str, dict[str, Any]]:
    from app.inference import analyze_inspiration  # heavy import, only when running live
    from app.schemas import InspirationAnalysisRequest

    suffix_mime = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    out: dict[str, dict[str, Any]] = {}
    for entry in entries:
        file = images / entry.image_path
        payload = {
            "imageBase64": base64.b64encode(file.read_bytes()).decode(),
            "mimeType": suffix_mime.get(file.suffix.lower(), "image/jpeg"),
        }
        started = time.perf_counter()
        result = analyze_inspiration(InspirationAnalysisRequest.model_validate(payload))
        out[entry.id] = {
            "id": entry.id,
            "profile": result.profile.model_dump(by_alias=True) if result.profile else None,
            "latencyMs": (time.perf_counter() - started) * 1000,
            "model": result.model_version,
        }
    return out


def build_samples(entries: list[ManifestEntry], predictions: dict[str, dict[str, Any]]) -> list[Sample]:
    missing = [e.id for e in entries if e.id not in predictions]
    if missing:
        raise SystemExit(f"predictions missing for: {', '.join(missing[:10])}")
    return [
        Sample(
            id=e.id,
            expected=e.expected,
            predicted=predictions[e.id].get("profile"),
            category=e.category,
            latency_ms=predictions[e.id].get("latencyMs"),
            raw=predictions[e.id].get("raw"),
        )
        for e in entries
    ]


def run(args: argparse.Namespace) -> int:
    entries = load_manifest(Path(args.manifest))
    if not entries:
        print("manifest is empty — nothing to evaluate", file=sys.stderr)
        return 2
    predictions = (
        load_predictions(Path(args.predictions))
        if args.predictions
        else predict_live(entries, Path(args.images))
    )
    metrics = compute_metrics(build_samples(entries, predictions))

    findings: list[Finding] = []
    if args.thresholds and Path(args.thresholds).exists():
        findings += check_thresholds(metrics, json.loads(Path(args.thresholds).read_text("utf-8")))
    if args.baseline and Path(args.baseline).exists():
        baseline = json.loads(Path(args.baseline).read_text("utf-8")).get("metrics", {})
        findings += check_regressions(metrics, baseline, args.tolerance)

    models = {p.get("model") for p in predictions.values() if p.get("model")}
    meta = {"model": args.model or ", ".join(sorted(models)) or "inconnu", "manifest": args.manifest}
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.json").write_text(
        json.dumps({"meta": meta, "metrics": metrics, "findings": [f.__dict__ for f in findings]}, indent=2),
        encoding="utf-8",
    )
    markdown = render_markdown(metrics, findings, meta)
    (out / "report.md").write_text(markdown, encoding="utf-8")
    print(markdown)
    return 1 if findings and args.fail_on_findings else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.evaluation", description=__doc__)
    parser.add_argument("--manifest", default=str(DATA_DIR / "manifest.jsonl"))
    parser.add_argument("--predictions")
    parser.add_argument("--images")
    parser.add_argument("--model")
    parser.add_argument("--thresholds", default=str(DATA_DIR / "thresholds.json"))
    parser.add_argument("--baseline")
    parser.add_argument("--tolerance", type=float, default=0.02)
    parser.add_argument("--out", default="ml/data/eval/out")
    parser.add_argument(
        "--fail-on-findings", action="store_true", help="exit 1 on threshold/regression (blocking CI mode)"
    )
    args = parser.parse_args(argv)
    if bool(args.predictions) == bool(args.images):
        parser.error("give exactly one of --predictions or --images")
    return run(args)


if __name__ == "__main__":
    raise SystemExit(main())
