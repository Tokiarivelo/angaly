"""Side-by-side review sheets: each dress photo next to its 3D front capture (4 pairs per sheet).

    python ml/scripts/dress_compare_sheet.py --results ~/angaly-dress-bench2/results.json \
        --captures <capture-dir> --photos ~/angaly-dress-met ~/angaly-dress-images/robe-portee --out <dir>
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

H = 420


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--results", required=True)
    ap.add_argument("--captures", required=True)
    ap.add_argument("--photos", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--per-sheet", type=int, default=4)
    args = ap.parse_args()
    results = json.loads(Path(args.results).expanduser().read_text())
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    pairs = []
    for name, row in results.items():
        front = Path(args.captures) / f"{row.get('projectId')}-front.png"
        photo = next((Path(d).expanduser() / name for d in args.photos if (Path(d).expanduser() / name).exists()), None)
        if not photo or not front.exists():
            continue
        p = Image.open(photo).convert("RGB")
        p = p.resize((int(p.width * H / p.height), H))
        f = Image.open(front).convert("RGB").crop((110, 10, 462, 410)).resize((int(352 * H / 400), H))
        pair = Image.new("RGB", (p.width + f.width, H + 18), "white")
        pair.paste(p, (0, 18))
        pair.paste(f, (p.width, 18))
        ImageDraw.Draw(pair).text((4, 3), f"{name}  {row['projectId'][:8]}", fill="black")
        pairs.append(pair)
    for i in range(0, len(pairs), args.per_sheet):
        chunk = pairs[i : i + args.per_sheet]
        sheet = Image.new("RGB", (sum(c.width for c in chunk), H + 18), "white")
        x = 0
        for c in chunk:
            sheet.paste(c, (x, 0))
            x += c.width
        sheet.save(out / f"sheet-{i // args.per_sheet:02d}.jpg", quality=88)
    print(len(pairs), "pairs")


if __name__ == "__main__":
    main()
