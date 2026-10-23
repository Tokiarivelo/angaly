"""Applies hand-written (or other-model) garment readings to benchmark projects: patches cutType, details,
extended parameters (ease, fullness, lengths, drape blocks) and the stored analysis profile, then regenerates
the pattern with the standard measurements. Used when the configured vision provider is unavailable.

    python ml/scripts/apply_profile_analysis.py --results ~/angaly-dress-bench2/results.json \
        --analysis ml/data/dress_benchmark_opus_analysis.json [--only met-dress-023.jpg]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx

from dress_benchmark import API, MEASUREMENTS, login


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--results", required=True)
    ap.add_argument("--analysis", required=True)
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    results = json.loads(Path(args.results).expanduser().read_text())
    analysis = json.loads(Path(args.analysis).read_text())
    with httpx.Client(timeout=120) as client:
        headers = login(client, "client@angaly.mg", "Client@Angaly2026!")
        for name, reading in analysis.items():
            if name.startswith("_") or (args.only and name not in args.only) or "projectId" not in results.get(name, {}):
                continue
            pid = results[name]["projectId"]
            project = client.get(f"{API}/pattern-projects/{pid}", headers=headers).json()["data"]
            stored = project.get("inspirationAnalysisJson") or {}
            profile = {**(stored.get("profile") or {}), "cutType": reading["cutType"], "details": reading["details"],
                       "fit": reading["fit"], "drapeBlocks": reading.get("blocks", []), "readBy": "claude-opus-5-5 (Claude Code)"}
            fit = reading["fit"]
            ext = {k: fit[k] for k in ("ease", "fullness", "lengths") if k in fit}
            ext["drape"] = {"blocks": reading.get("blocks", [])}
            patch = {"cutType": reading["cutType"], "detailsJson": reading["details"], "parametersExtJson": ext,
                     "inspirationAnalysisJson": {**stored, "profile": profile}}
            r = client.patch(f"{API}/pattern-projects/{pid}", headers=headers, json=patch)
            if r.status_code >= 300:
                print(name, "PATCH", r.status_code, r.text[:300])
                continue
            gen = client.post(f"{API}/pattern-projects/{pid}/generate", headers=headers, json={"measurements": MEASUREMENTS})
            body = gen.json()
            if gen.status_code >= 300:
                print(name, "GENERATE", gen.status_code, str(body)[:300])
                continue
            version = body["data"]
            results[name].update({"version": version["versionNumber"], "profile": profile,
                                  "pieces": [{"name": p["name"], "quantity": p["quantity"]} for p in version["pieces"]]})
            print(name, pid[:8], "v", version["versionNumber"], [p["name"] for p in version["pieces"]])
    Path(args.results).expanduser().write_text(json.dumps(results, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
