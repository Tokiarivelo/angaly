"""Sleeve photos (worn, by sleeve type) and period pattern-drafting plates from Wikimedia Commons, to compare
the engine's sleeve geometry with real sleeves. Images stay OUTSIDE the repository; `candidates.jsonl` keeps
licence + source page. Labels come from the Commons category, they are NOT validated by a seamstress.

    python ml/scripts/fetch_sleeve_data.py --out ~/angaly-sleeves --per-category 40
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import httpx

from fetch_eval_photos import UA, image_info, commons

# tag (engine sleeve family) → Commons categories
CATEGORIES: dict[str, list[str]] = {
    "puff": ["Puff sleeves", "Puff sleeves with sheer oversleeves", "Medici sleeve"],
    "gigot": ["Leg of mutton sleeves"],
    "bishop": ["Bishop sleeves", "Poet shirts"],
    "bell": ["Trumpet sleeves", "Pagoda sleeves"],
    "elbow": ["Elbow-length sleeve clothing", "Marie sleeves"],
    "cap": ["Cap sleeves"],
    "raglan": ["Raglan sleeves"],
    "kimono": ["Furisode", "Batwing sleeves"],
    "generic": ["Sleeves", "Virago sleeves", "Imbecile sleeves"],
    "draft": ["Sewing patterns", "Dressmaking"],
}


def files(client: httpx.Client, category: str, limit: int) -> list[str]:
    titles: list[str] = []
    cont: dict[str, str] = {}
    while len(titles) < limit * 3:
        data = commons(client, action="query", list="categorymembers", cmtitle=f"Category:{category}",
                       cmtype="file", cmlimit=100, **cont)
        titles += [m["title"] for m in data.get("query", {}).get("categorymembers", [])
                   if m["title"].lower().endswith((".jpg", ".jpeg", ".png"))]
        if "continue" not in data:
            break
        cont = {"cmcontinue": data["continue"]["cmcontinue"]}
    return titles


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--per-category", type=int, default=40)
    ap.add_argument("--tags", nargs="*")
    args = ap.parse_args()
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    log = out / "candidates.jsonl"
    rows = [json.loads(l) for l in log.read_text().splitlines() if l.strip()] if log.exists() else []
    seen = {r["title"] for r in rows}
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["tag"]] = counts.get(r["tag"], 0) + 1
    with httpx.Client(follow_redirects=True) as client:
        for tag, categories in CATEGORIES.items():
            if args.tags and tag not in args.tags:
                continue
            for category in categories:
                try:
                    titles = [t for t in files(client, category, args.per_category) if t not in seen]
                    for i in range(0, len(titles), 25):
                        for item in image_info(client, titles[i:i + 25]):
                            if counts.get(tag, 0) >= args.per_category * len(categories) or item["title"] in seen:
                                continue
                            n = counts.get(tag, 0) + 1
                            name = f"{tag}/{tag}-{n:03d}.jpg"
                            target = out / name
                            target.parent.mkdir(exist_ok=True)
                            image = client.get(item["url"], headers=UA, timeout=60)
                            if image.status_code != 200 or len(image.content) < 5_000:
                                time.sleep(1)
                                continue
                            target.write_bytes(image.content)
                            seen.add(item["title"])
                            counts[tag] = n
                            rows.append({"id": f"{tag}-{n:03d}", "imagePath": name, "tag": tag, "category": category, **item})
                            log.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n")
                            time.sleep(1.2)
                except httpx.HTTPError as exc:
                    print(f"skip {category}: {exc}")
            print(tag, counts.get(tag, 0), flush=True)
    print(f"{len(rows)} images in {out}")


if __name__ == "__main__":
    main()
