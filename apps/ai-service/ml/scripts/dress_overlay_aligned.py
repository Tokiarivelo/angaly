"""Superposes a dress photo on the 3D front capture, aligned on two heights (collar and hem) and the centre line.

    python ml/scripts/dress_overlay_aligned.py photo.jpg front.png out.png \
        --photo-collar 58 --photo-hem 665 --photo-centre 215 --body-neck 150 --body-hem 655 --body-centre 477

Heights are read off both images resized to 700 px high (what the review contact sheets use).
"""
from __future__ import annotations

import argparse

from PIL import Image


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("photo")
    ap.add_argument("front")
    ap.add_argument("out")
    ap.add_argument("--photo-collar", type=float, required=True)
    ap.add_argument("--photo-hem", type=float, required=True)
    ap.add_argument("--photo-centre", type=float, required=True)
    ap.add_argument("--body-neck", type=float, required=True)
    ap.add_argument("--body-hem", type=float, required=True)
    ap.add_argument("--body-centre", type=float, required=True)
    ap.add_argument("--opacity", type=float, default=0.5)
    args = ap.parse_args()
    height = 700
    front = Image.open(args.front).convert("RGB")
    front = front.resize((int(front.width * height / front.height), height))
    photo = Image.open(args.photo).convert("RGB")
    photo = photo.resize((int(photo.width * height / photo.height), height))
    k = (args.body_hem - args.body_neck) / (args.photo_hem - args.photo_collar)
    photo = photo.resize((int(photo.width * k), int(photo.height * k)))
    ox = int(args.body_centre - args.photo_centre * k)
    oy = int(args.body_neck - args.photo_collar * k)
    layer = Image.new("RGB", front.size, (0, 0, 0))
    layer.paste(photo, (ox, oy))
    mask = Image.new("L", front.size, 0)
    mask.paste(255, (ox, oy, ox + photo.width, oy + photo.height))
    Image.composite(Image.blend(front, layer, args.opacity), front, mask).save(args.out)


if __name__ == "__main__":
    main()
