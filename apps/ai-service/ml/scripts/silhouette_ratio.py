"""Silhouette widths of a dress, on a museum photo (plain background) or a 3D capture (dark background).

Measures, on the central part of the figure (the run of pixels through the middle column, so arms and stands
off to the side are left out): the waist (narrowest row between 30 % and 55 % of the figure's height) and the
hem (widest row in the bottom 12 %), and returns hem ÷ waist — the same quantity as `fullness.skirt`, seen
from the front. Used to calibrate the skirt fullness of the benchmark dresses against their photos.

    python ml/scripts/silhouette_ratio.py photo.jpg [capture-front.png …]
"""
from __future__ import annotations

import sys

import numpy as np
from PIL import Image


def mask_of(path: str) -> np.ndarray:
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.int32)
    h, w, _ = img.shape
    border = np.concatenate([img[:4].reshape(-1, 3), img[-4:].reshape(-1, 3), img[:, :4].reshape(-1, 3), img[:, -4:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((img - bg) ** 2).sum(axis=2))
    # A dark 3D background is near-uniform; a photo backdrop has a gradient: a looser threshold.
    threshold = 28 if bg.sum() < 150 else 38
    mask = dist > threshold
    # Close small holes (a pale fabric close to the backdrop, seam lines): 5 px horizontally and vertically.
    for axis in (0, 1):
        grown = mask.copy()
        for shift in range(1, 4):
            grown |= np.roll(mask, shift, axis=axis) & np.roll(mask, -shift, axis=axis)
        mask = grown
    # Ignore the 3D viewer's caption strip and gizmo (bottom-left text, bottom-right axes).
    if bg.sum() < 150:
        mask[int(h * 0.94):, :] = False
        mask[int(h * 0.75):, int(w * 0.8):] = False
    return mask


def central_width(row: np.ndarray, centre: int) -> int:
    if not row[centre]:
        # The centre column may fall on a seam line or a gap: look a few pixels around it.
        near = np.flatnonzero(row[max(0, centre - 6): centre + 7])
        if near.size == 0:
            return 0
        centre = max(0, centre - 6) + int(near[0])
    left = centre
    while left > 0 and row[left - 1:left + 1].any():
        left -= 1
    right = centre
    while right < row.size - 1 and row[right:right + 2].any():
        right += 1
    return right - left


def measure(path: str) -> dict[str, float]:
    mask = mask_of(path)
    rows = np.flatnonzero(mask.any(axis=1))
    if rows.size == 0:
        return {}
    top, bottom = int(rows[0]), int(rows[-1])
    height = bottom - top
    cols = np.flatnonzero(mask[top + height // 2])
    centre = int(np.median(cols)) if cols.size else mask.shape[1] // 2
    widths = {y: central_width(mask[y], centre) for y in range(top, bottom + 1)}
    waist_rows = range(top + int(height * 0.3), top + int(height * 0.55))
    band = [widths[y] for y in waist_rows]
    # The narrowest plausible row: a sliver (a gap in a pale fabric) is not the waist.
    floor = 0.35 * max(band)
    waist_y = min(waist_rows, key=lambda y: widths[y] if widths[y] >= floor else 10**9)
    hem_rows = range(bottom - int(height * 0.12), bottom - int(height * 0.02))
    hem = max(widths[y] for y in hem_rows)
    waist = widths[waist_y]
    return {"waist": waist, "hem": hem, "ratio": round(hem / waist, 2) if waist else 0.0, "waistAt": round((waist_y - top) / height, 2)}


if __name__ == "__main__":
    for item in sys.argv[1:]:
        print(item.rsplit("/", 1)[-1], measure(item))
