"""Checks on a settled garment that the render alone hides.

A first check counted the arm points inside each sleeve's end ring; the ring deforms as the cloth settles, and it
read 0.2–0.45 on sleeves covering the arm to the wrist. What is measured is what is seen: bare skin.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from .job import Body, Panel
from .spatial import nearest_within

TUBES = ("sleeve", "cuff")

BARE_REACH = 0.04
"""Arm skin with sleeve cloth this close (m) in the drape is the sleeved arm."""
BARE_DRIFT = 0.03
"""Sleeved skin whose nearest sleeve cloth ends this much (m) further than in the drape is bare: the sleeve has slid
off or through the arm. (A puff standing off the arm is not bare: it stood off it in the drape too.)"""


def bare_arm(start: Sequence[Panel], now: Sequence[Panel], body: Body) -> float | None:
    """Share of the sleeved arm's skin left bare at the end (0 = covered as at the start).

    The sleeved arm is the arm skin (arm weight ≥ 0.5) that sleeve or cuff cloth covered within `BARE_REACH` in the
    drape; it is looked at again on the body in its final pose, against the cloth where it ended (`BARE_DRIFT`).
    """
    if body.arm_weights is None:
        return None
    arm = np.where(body.arm_weights >= 0.5)[0]
    tubes = [i for i, p in enumerate(start) if p.zone in TUBES]
    if len(arm) == 0 or not tubes:
        return None
    cloth_start = np.concatenate([start[i].positions for i in tubes])
    cloth_now = np.concatenate([now[i].positions for i in tubes])
    _, d_start = nearest_within(body.positions[arm], cloth_start, BARE_REACH)
    covered = np.isfinite(d_start)
    if not covered.any():
        return None
    reach = d_start[covered] + BARE_DRIFT
    _, d_now = nearest_within(body.final[arm[covered]], cloth_now, float(reach.max()))
    bare = d_now > reach
    return round(float(bare.mean()), 3)


SILHOUETTE_BAND = 0.03
"""Height (m) of the horizontal slice a width is measured on: above the 2.5 cm edge of the refined cloth, so a slice
always crosses a whole ring of vertices (a 1 cm slice caught a few points and read waists narrower than the body)."""
SILHOUETTE_STEP = 0.01
WAIST_SPAN = (0.55, 0.72)
"""Where the natural waist is looked for on the body, as a share of its height from the feet."""


def body_waist_height(body: Body) -> float | None:
    """Height (m) of the narrowest slice of the torso (arms left out) in `WAIST_SPAN`: the natural waist."""
    torso = body.positions if body.arm_weights is None else body.positions[body.arm_weights <= 0.05]
    if len(torso) < 10:
        return None
    low, high = float(body.positions[:, 1].min()), float(body.positions[:, 1].max())
    best: tuple[float, float] | None = None
    for y in np.arange(low + WAIST_SPAN[0] * (high - low), low + WAIST_SPAN[1] * (high - low), SILHOUETTE_STEP):
        row = torso[np.abs(torso[:, 1] - y) <= SILHOUETTE_BAND / 2]
        if len(row) < 3:
            continue
        w = float(row[:, 0].max() - row[:, 0].min())
        if best is None or w < best[0]:
            best = (w, float(y))
    return None if best is None else best[1]


def silhouette(panels: Sequence[Panel], body: Body | None = None) -> dict[str, float] | None:
    """Front silhouette of the garment, sleeves left out: hem width ÷ waist width.

    Compares with the photo-calibrated `fullness.skirt` of the bench dresses (hem ÷ waist seen from the front,
    `apps/ai-service/ml/scripts/silhouette_ratio.py`). The waist is taken at the body's natural waist when the body is
    given (`body_waist_height`), else as the narrowest slice between 20 % and 45 % of the garment's height; the hem is
    the widest slice in the garment's bottom 12 %. Widths are front-projected (x extent of a slice).
    """
    garment = [p.positions for p in panels if p.zone not in TUBES and len(p.positions)]
    if not garment:
        return None
    pts = np.concatenate(garment)
    top, bottom = float(pts[:, 1].max()), float(pts[:, 1].min())
    height = top - bottom
    if height < 0.2:
        return None

    def width(y: float) -> float:
        row = pts[np.abs(pts[:, 1] - y) <= SILHOUETTE_BAND / 2]
        return float(row[:, 0].max() - row[:, 0].min()) if len(row) >= 3 else 0.0

    waist_y = body_waist_height(body) if body is not None else None
    if waist_y is not None and bottom < waist_y < top:
        waists = [width(waist_y)]
    else:
        rows = np.arange(top - 0.20 * height, top - 0.45 * height, -SILHOUETTE_STEP)
        waists = [w for w in (width(y) for y in rows) if w > 0]
    hem_rows = np.arange(bottom + SILHOUETTE_BAND / 2, bottom + 0.12 * height, SILHOUETTE_STEP)
    hems = [width(y) for y in hem_rows]
    waists = [w for w in waists if w > 0]
    if not waists or not hems or max(hems) <= 0:
        return None
    waist, hem = min(waists), max(hems)
    return {"waistCm": round(waist * 100, 1), "hemCm": round(hem * 100, 1), "ratio": round(hem / waist, 2)}
