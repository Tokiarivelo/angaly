"""Downloads freely-licensed candidate photos for the S6 golden set from Wikimedia Commons.

Only files whose Commons licence is public domain / CC0 / CC-BY / CC-BY-SA are kept; author, licence
and source page are recorded in `candidates.jsonl` (needed for attribution, and copied into the
manifest `source`/`license`). Images go to --out (OUTSIDE the repository), never into git.

    python ml/scripts/fetch_eval_photos.py --out ~/angaly-eval-images --per-category 12
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import httpx

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "angaly-eval/0.1 (golden-set builder; contact: jack.bun14@gmail.com)"}
ALLOWED = re.compile(r"^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]\d)", re.IGNORECASE)

# tag → Commons categories
CATEGORIES: dict[str, list[str]] = {
    "robe": ["Evening dresses", "Cocktail dresses", "Maxi dresses", "Summer dresses",
             "Women in dresses", "Dresses on mannequins", "Little black dresses"],
    # Modern dresses worn by real people (training / fit comparison), not fashion plates.
    "robe-portee": ["Maxi dresses", "Polka dot dresses", "Pleated dresses", "Wrap dresses", "A-line dresses",
                    "Sundresses", "Empire waist dresses", "Women in long dresses", "Summer dresses",
                    "Shirt dresses", "Midi dresses", "Floral dresses", "Evening gowns", "Cocktail dresses",
                    "Women wearing dresses", "Dresses of the 2010s", "Dresses of the 2020s"],
    "mariee": ["Wedding dresses", "Bridal gowns", "Brides", "Wedding dresses on mannequins"],
    "jupe": ["Skirts", "Pleated skirts", "Long skirts", "Mini skirts", "Women wearing skirts"],
    "pantalon": ["Trousers", "Wide-leg trousers", "Jeans"],
    "veste": ["Blazers", "Jackets"],
    "costume": ["Suits", "Tuxedos", "Women's suits", "Men in suits"],
    "chemise": ["Shirts", "Blouses"],
    # Worn garments by cut, for the fit-vs-inspiration benchmark of non-dress garments (one tag per shape).
    "pantalon-patte": ["Bell-bottoms", "Flared trousers", "Flared jeans"],
    "pantalon-large": ["Palazzo pants", "Wide-leg trousers", "Culottes"],
    "pantalon-droit": ["Women wearing trousers", "Trousers", "Chinos", "Jeans"],
    "pantalon-slim": ["Skinny jeans", "Leggings", "Cigarette pants"],
    "pantalon-baggy": ["Baggy pants", "Harem pants", "Cargo pants", "Sweatpants"],
    "jupe-crayon": ["Pencil skirts", "Women wearing pencil skirts"],
    "jupe-cercle": ["Circle skirts", "Poodle skirts", "Full skirts"],
    "jupe-trapeze": ["A-line skirts", "Midi skirts", "Maxi skirts", "Long skirts"],
    "jupe-plissee": ["Pleated skirts", "Kilts"],
    "chemise-portee": ["Women wearing blouses", "Blouses", "Dress shirts", "Women wearing shirts"],
    "veste-portee": ["Women wearing blazers", "Blazers", "Women wearing jackets"],
    "costume-porte": ["Women's suits", "Women wearing suits", "Pantsuits"],
    # Training pool of the local vision model (`train_vision_model.py`), kept apart from the golden set's categories.
    "mariee-3": ["Wedding dresses", "Brides", "Bridal gowns", "Wedding dresses on mannequins", "Wedding dresses in museums"],
    "mariee-2": ["Wedding gowns", "Brides in white dresses", "Wedding dresses of the 2010s", "Ball gowns"],
    "drape-2": ["Women in saris", "Hanbok", "Ao dai", "Dirndls", "Sarongs"],
    "autre-2": ["Jumpsuits", "Overcoats", "Capes (clothing)", "Ponchos", "Kimonos on display"],
    "manches-2": ["Puff sleeves", "Leg-of-mutton sleeves", "Bishop sleeves", "Off-the-shoulder dresses"],
    "drape": ["Saris", "Lambas", "Kimonos", "Draped garments", "Kaftans"],
    "non-vetement": ["Chairs", "Landscapes", "Dogs", "Buildings"],
}


def commons(client: httpx.Client, **params: str | int) -> dict:
    response = client.get(API, params={"format": "json", **params}, headers=UA, timeout=30)
    response.raise_for_status()
    return response.json()


def category_files(client: httpx.Client, category: str, limit: int) -> list[str]:
    data = commons(client, action="query", list="categorymembers", cmtitle=f"Category:{category}",
                   cmtype="file", cmlimit=min(limit * 4, 100))
    return [m["title"] for m in data.get("query", {}).get("categorymembers", [])
            if m["title"].lower().endswith((".jpg", ".jpeg", ".png"))]


def image_info(client: httpx.Client, titles: list[str]) -> list[dict]:
    data = commons(client, action="query", titles="|".join(titles), prop="imageinfo",
                   iiprop="url|extmetadata|size", iiurlwidth=768)
    out = []
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        meta = info.get("extmetadata", {})
        licence = meta.get("LicenseShortName", {}).get("value", "")
        if not ALLOWED.match(licence) or "nc" in licence.lower():
            continue
        author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "unknown")).strip()
        out.append({"title": page["title"], "url": info.get("thumburl") or info["url"],
                    "page": info["descriptionurl"], "license": licence, "author": author[:120]})
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    parser.add_argument("--per-category", type=int, default=12)
    parser.add_argument("--tags", nargs="*", help="only these tags (default: all)")
    parser.add_argument("--suffix", default="", help="id/file suffix so several runs never collide")
    args = parser.parse_args()
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    rows: list[dict] = []
    with httpx.Client(follow_redirects=True) as client:
        for tag, categories in CATEGORIES.items():
            if args.tags and tag not in args.tags:
                continue
            kept = 0
            for category in categories:
                if kept >= args.per_category:
                    break
                try:
                    titles = category_files(client, category, args.per_category)
                    for i in range(0, len(titles), 25):
                        for item in image_info(client, titles[i:i + 25]):
                            if kept >= args.per_category or item["title"] in seen:
                                continue
                            seen.add(item["title"])
                            name = f"{tag}/{tag}-{kept + 1:03d}{args.suffix}.jpg"
                            target = out / name
                            target.parent.mkdir(exist_ok=True)
                            image = client.get(item["url"], headers=UA, timeout=60)
                            if image.status_code != 200 or len(image.content) < 5_000:
                                time.sleep(1)
                                continue
                            target.write_bytes(image.content)
                            rows.append({"id": f"{tag}-{kept + 1:03d}{args.suffix}", "imagePath": name, "tag": tag,
                                         "category": category, **item})
                            kept += 1
                            time.sleep(1.5)  # be polite to Wikimedia
                except httpx.HTTPError as exc:
                    print(f"skip {category}: {exc}")
            print(f"{tag}: {kept}")
    (out / "candidates.jsonl").write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in rows) + "\n")
    print(f"{len(rows)} images in {out}")


if __name__ == "__main__":
    main()
