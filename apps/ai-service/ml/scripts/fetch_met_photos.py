"""Downloads CC0 garment photos from The Metropolitan Museum of Art Open Access API (Costume Institute,
department 8) for the S6 golden set. Museum shots are clean (mannequin / flat, one garment, plain
background) and come with title, object name, date and culture — useful hints when labelling.

    python -m ml.scripts.fetch_met_photos --out ~/angaly-eval-met --per-tag 14

Output layout/`candidates.jsonl` match `fetch_eval_photos.py`, so `build_eval_manifest` reads both."""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import httpx

BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
UA = {"User-Agent": "angaly-eval/0.1 (golden-set builder; contact: jack.bun14@gmail.com)"}
LICENSE = "CC0 (The Met Open Access)"

QUERIES: dict[str, list[str]] = {
    "robe": ["evening dress", "day dress", "cocktail dress", "dinner dress"],
    "mariee": ["wedding dress", "bridal gown", "wedding ensemble"],
    "jupe": ["skirt", "evening skirt"],
    "pantalon": ["trousers", "pants", "pantsuit"],
    "veste": ["jacket", "blazer", "coat"],
    "costume": ["suit", "woman's suit", "tuxedo"],
    "chemise": ["blouse", "shirt", "shirtwaist"],
    "drape": ["sari", "draped dress", "wrap dress", "himation"],
    "autre": ["jumpsuit", "cape", "dress ensemble"],
}


def get(client: httpx.Client, path: str, **params: str | int) -> dict:
    for attempt in range(3):
        response = client.get(f"{BASE}/{path}", params=params, headers=UA, timeout=30)
        if response.status_code == 200:
            return response.json()
        time.sleep(2 * (attempt + 1))
    return {}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    parser.add_argument("--per-tag", type=int, default=14)
    parser.add_argument("--suffix", default="m")
    args = parser.parse_args()
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    seen: set[int] = set()
    rows: list[dict] = []
    with httpx.Client(follow_redirects=True) as client:
        for tag, queries in QUERIES.items():
            kept = 0
            for query in queries:
                if kept >= args.per_tag:
                    break
                ids = get(client, "../v1.1/search", q=query, hasImages="true",
                          isPublicDomain="true", departmentId=8, limit=60).get("objectIDs") or []
                for object_id in ids[:: max(1, len(ids) // (args.per_tag * 2) or 1)]:
                    if kept >= args.per_tag:
                        break
                    if object_id in seen:
                        continue
                    seen.add(object_id)
                    meta = get(client, f"objects/{object_id}")
                    url = meta.get("primaryImageSmall")
                    if not meta.get("isPublicDomain") or not url:
                        continue
                    image = client.get(url, headers=UA, timeout=60)
                    if image.status_code != 200 or len(image.content) < 5_000:
                        continue
                    kept += 1
                    name = f"{tag}/{tag}-{kept:03d}{args.suffix}.jpg"
                    (out / name).parent.mkdir(exist_ok=True)
                    (out / name).write_bytes(image.content)
                    rows.append({
                        "id": f"{tag}-{kept:03d}{args.suffix}", "imagePath": name, "tag": tag,
                        "category": query, "title": meta.get("title", ""), "url": url,
                        "page": meta.get("objectURL", ""), "license": LICENSE,
                        "author": meta.get("artistDisplayName") or "The Metropolitan Museum of Art",
                        "objectName": meta.get("objectName", ""), "date": meta.get("objectDate", ""),
                        "culture": meta.get("culture", ""),
                    })
                    time.sleep(0.5)
            print(f"{tag}: {kept}")
    (out / "candidates.jsonl").write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n")
    print(f"{len(rows)} images in {out}")


if __name__ == "__main__":
    main()
