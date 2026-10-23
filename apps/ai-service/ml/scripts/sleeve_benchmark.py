"""Reads sleeve photos with the vision model and compares what it sees with the sleeve family the photo was
filed under (`fetch_sleeve_data.py`). Analysis only (no project): one row per photo with the `manches` detail,
`fullness.sleeve` and `lengths.sleevePct`, then a confusion table per family.

    python ml/scripts/sleeve_benchmark.py --root ~/angaly-sleeves --per-tag 8 --out ~/angaly-sleeves/analysis.json
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

import httpx

from dress_benchmark import API, login, upload

TAGS = ["puff", "gigot", "bishop", "bell", "elbow", "cap", "raglan", "kimono"]


def analyse(client: httpx.Client, headers: dict[str, str], path: Path, provider: str) -> dict:
    _, url = upload(client, headers, path)
    data = client.post(f"{API}/ai-inference/inspiration-analysis", headers=headers, timeout=180,
                       json={"inspirationImageUrl": url, "aiProvider": provider, "refresh": True}).json()["data"]
    profile = data.get("profile") or {}
    fit = profile.get("fit") or {}
    return {"image": str(path), "isGarment": profile.get("isGarment"), "garmentType": profile.get("garmentType"),
            "manches": (profile.get("details") or {}).get("manches"),
            "fullnessSleeve": (fit.get("fullness") or {}).get("sleeve"),
            "sleevePct": (fit.get("lengths") or {}).get("sleevePct"), "model": data.get("modelUsed")}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", required=True)
    ap.add_argument("--per-tag", type=int, default=8)
    ap.add_argument("--out", required=True)
    ap.add_argument("--provider", default="ANTHROPIC")
    args = ap.parse_args()
    root = Path(args.root).expanduser()
    out = Path(args.out).expanduser()
    results: dict[str, dict] = json.loads(out.read_text()) if out.exists() else {}
    with httpx.Client(timeout=60) as client:
        headers = login(client, "client@angaly.mg", "Client@Angaly2026!")
        for tag in TAGS:
            for path in sorted((root / tag).glob("*.jpg"))[: args.per_tag]:
                key = f"{tag}/{path.name}"
                if results.get(key, {}).get("isGarment") is not None:
                    continue
                try:
                    results[key] = analyse(client, headers, path, args.provider)
                except Exception as exc:  # one bad photo must not stop the run
                    results[key] = {"image": str(path), "error": f"{type(exc).__name__}: {exc}"}
                out.write_text(json.dumps(results, ensure_ascii=False, indent=1))
                print(key, results[key].get("manches"), results[key].get("fullnessSleeve"), results[key].get("error", ""), flush=True)
    table: dict[str, Counter] = defaultdict(Counter)
    for key, row in results.items():
        if "error" not in row:
            table[key.split("/")[0]][f"{row.get('manches')}"] += 1
    for tag, counter in table.items():
        print(tag, dict(counter))


if __name__ == "__main__":
    main()
