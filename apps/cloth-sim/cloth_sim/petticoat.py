"""A petticoat under a long skirt: the collider that keeps the skirt's flare.

A flared or gored skirt of the 1890s stands out over a petticoat; simulated alone, the cloth closes in on the legs and
the A-line is lost. The petticoat is the skirt as draped (the pattern's own flare), drawn in towards the body's axis by
`INSET` so the skirt still falls into folds over it, from `BELOW_TOP` under the skirt's top (the hips stay free) to
`ABOVE_HEM` over its hem (the hem falls free onto the floor). It is
a collision object only: never rendered, never exported.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from .job import Panel
from .spatial import nearest_within

INSET = 0.025
"""How far (m) the petticoat lies inside the draped skirt."""
BELOW_TOP = 0.2
"""The petticoat starts this far (m) under the skirt's top: the waist and hips are left to the body."""
HAND_CLEARANCE = 0.12
"""No petticoat this close (m) to the hands: hands by the hips hit it and pushed the cuffs up the arms. (Starting it
below the hands instead left a shelf the skirt sat on, a ridge then a pouf at the hips.)"""
TAPER_INSET = 0.03
TAPER_HEIGHT = 0.12
"""Over its top `TAPER_HEIGHT` (m) the petticoat lies up to `TAPER_INSET` (m) further in: it fades in under the
skirt."""
ABOVE_HEM = 0.06
"""The petticoat stops this far (m) above the skirt's hem: the hem falls free onto the floor. Down to the hem, the
skirt's bottom edge caught on the petticoat's and folded under it, crumpled."""
HEM_TAPER_INSET = 0.03
HEM_TAPER_HEIGHT = 0.12
"""Over its bottom `HEM_TAPER_HEIGHT` (m) the petticoat draws in by up to `HEM_TAPER_INSET` (m) more: it fades out above
the hem. With a hard rim, the unsupported hem swung in under it, caught on it and folded up inside the skirt (the
hem of a stiff flared skirt rose 9-13 cm, docs/features/realistic-render-blender.md §19)."""
MIN_RADIUS = 0.05
"""Cloth closer than this (m) to the axis is not drawn further in."""


def petticoat(
    panels: Sequence[Panel],
    hands: np.ndarray | None = None,
    clearance: float = HAND_CLEARANCE,
    hem_taper: float = HEM_TAPER_INSET,
    above_hem: float = ABOVE_HEM,
) -> tuple[np.ndarray, np.ndarray] | None:
    """(positions, indices) of the petticoat under the skirt panels, or None for a garment without a skirt.

    `hands`: (k, 3) points of the hands (in every pose the body takes); the petticoat is cut away round them.
    `hem_taper`: how much further in (m) its bottom edge lies (0: a hard rim `INSET` inside the skirt).
    `above_hem`: how far (m) above the skirt's hem it stops.
    """
    skirts = [p for p in panels if p.zone == "skirt"]
    if not skirts:
        return None
    top = max(float(p.positions[:, 1].max()) for p in skirts)
    hem = min(float(p.positions[:, 1].min()) for p in skirts)
    # The skirt's plastron (a robe-manteau's front panel) closes the ring between the skirt's fronts.
    under = [p for p in panels if p.zone == "plastron" and float(p.positions[:, 1].max()) <= top + 0.01]
    parts = skirts + under
    allpos = np.concatenate([p.positions for p in parts])
    axis = allpos[allpos[:, 1] >= top - 0.05][:, [0, 2]].mean(axis=0)
    positions: list[np.ndarray] = []
    indices: list[np.ndarray] = []
    offset = 0
    for p in parts:
        pos = p.positions.copy()
        radial = pos[:, [0, 2]] - axis
        r = np.linalg.norm(radial, axis=1)
        # Tucked further in near its top edge, so the skirt does not sit on a shelf there (a ridge at the knee).
        below = np.clip((top - BELOW_TOP - p.positions[:, 1]) / TAPER_HEIGHT, 0.0, 1.0)
        inset = INSET + TAPER_INSET * (1 - below * below * (3 - 2 * below))
        # And near its bottom edge, so the hem slides off it instead of catching on a rim.
        above = np.clip((p.positions[:, 1] - hem - above_hem) / HEM_TAPER_HEIGHT, 0.0, 1.0)
        inset = inset + hem_taper * (1 - above * above * (3 - 2 * above))
        scale = np.where(r > MIN_RADIUS + inset, (r - inset) / np.maximum(r, 1e-9), 1.0)
        pos[:, 0] = axis[0] + radial[:, 0] * scale
        pos[:, 2] = axis[1] + radial[:, 1] * scale
        heights = p.positions[p.indices, 1]
        keep = (heights < top - BELOW_TOP).all(axis=1) & (heights > hem + above_hem).all(axis=1)
        if hands is not None and len(hands):
            _, d = nearest_within(pos, hands, clearance)
            keep &= ~(np.isfinite(d)[p.indices]).any(axis=1)
        if not keep.any():
            continue
        used, faces = np.unique(p.indices[keep], return_inverse=True)
        positions.append(pos[used])
        indices.append(faces.reshape(-1, 3) + offset)
        offset += len(used)
    if not positions:
        return None
    return np.concatenate(positions), np.concatenate(indices)
