"""CC0 dress photos (1925 → today) from The Met Open Access API, for fit-vs-photo benchmarks and S7 training.

Clean museum shots (one dress, mannequin, plain background) with title / date / culture. Images go OUTSIDE
the repository; `candidates.jsonl` keeps licence + source page. Labels are NOT validated: nothing here enters
training before a seamstress confirms it (docs/features/ai-model-settings.md).

    python ml/scripts/fetch_met_dresses.py --out ~/angaly-dress-met --count 80
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import httpx

BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
UA = {"User-Agent": "angaly-eval/0.1 (dress benchmark; contact: jack.bun14@gmail.com)"}
QUERIES = ["evening dress", "day dress", "cocktail dress", "dress", "gown", "summer dress", "wrap dress",
           "shirtwaist dress", "maxi dress", "pleated dress", "polka dot dress", "printed dress", "sundress"]
KEEP = re.compile(r"dress|gown|frock", re.IGNORECASE)
DROP = re.compile(r"ensemble|doll|miniature|sample|fragment|bodice only|petticoat|nightgown|wedding", re.IGNORECASE)


def get(client: httpx.Client, url: str, **params: str | int) -> dict:
    for attempt in range(3):
        response = client.get(url, params=params, headers=UA, timeout=30)
        if response.status_code == 200:
            return response.json()
        time.sleep(2 * (attempt + 1))
    return {}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    parser.add_argument("--count", type=int, default=80)
    parser.add_argument("--since", type=int, default=1925)
    args = parser.parse_args()
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    seen: set[int] = set()
    rows: list[dict] = []
    with httpx.Client(follow_redirects=True) as client:
        for query in QUERIES:
            if len(rows) >= args.count:
                break
            ids = get(client, "https://collectionapi.metmuseum.org/public/collection/v1.1/search", q=query,
                      hasImages="true", isPublicDomain="true", departmentId=8, dateBegin=args.since, dateEnd=2026
                      ).get("objectIDs") or []
            for object_id in ids:
                if len(rows) >= args.count:
                    break
                if object_id in seen:
                    continue
                seen.add(object_id)
                meta = get(client, f"{BASE}/objects/{object_id}")
                name, title = meta.get("objectName", ""), meta.get("title", "")
                url = meta.get("primaryImageSmall")
                if not meta.get("isPublicDomain") or not url or (meta.get("objectEndDate") or 0) < args.since:
                    continue
                if not KEEP.search(f"{name} {title}") or DROP.search(f"{name} {title}"):
                    continue
                image = client.get(url, headers=UA, timeout=60)
                if image.status_code != 200 or len(image.content) < 5_000:
                    continue
                file = f"met-dress-{len(rows) + 1:03d}.jpg"
                (out / file).write_bytes(image.content)
                rows.append({"id": file[:-4], "imagePath": file, "title": title, "objectName": name,
                             "date": meta.get("objectDate", ""), "culture": meta.get("culture", ""),
                             "page": meta.get("objectURL", ""), "url": url, "license": "CC0 (The Met Open Access)",
                             "author": meta.get("artistDisplayName") or "The Metropolitan Museum of Art"})
                time.sleep(0.4)
            print(f"{query}: {len(rows)} so far")
    (out / "candidates.jsonl").write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n")
    print(f"{len(rows)} images in {out}")


if __name__ == "__main__":
    main()
