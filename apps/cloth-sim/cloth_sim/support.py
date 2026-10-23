"""Support of a puffed sleeve (and of a bell skirt): where the cloth stands off the arm (the legs), it bends less.

A gigot or puff sleeve keeps its volume thanks to an interlining (tulle, organza, a stiff lining) that the drape does
not model as a layer. Simulated as one sheet of velvet, the puff collapses under its own weight and drags the sleeve
down the arm. Its stiffness is raised where the drape holds it away from the arm: the weight of each sleeve vertex in
Blender's bending group ramps from 0 against the arm (the fitted forearm keeps the fabric's own stiffness) to 1 where
it stands `FULL_SUPPORT_AT` off it, and the bending stiffness goes up to `SUPPORT_BENDING` × the fabric's there.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from .job import Body, Panel
from .spatial import nearest_growing

SUPPORTED = ("sleeve",)
SKIRT_SHARE = 1.0
"""A long skirt held out by its petticoat: the part standing off the legs gets this share of the full support."""
SKIRT_NO_SUPPORT_UNDER = 0.04
SKIRT_FULL_SUPPORT_AT = 0.15
NO_SUPPORT_UNDER = 0.015
"""Cloth closer than this (m) to the arm is fitted: no support."""
FULL_SUPPORT_AT = 0.04
"""Cloth this far (m) or more off the arm is the puff: full support."""
SUPPORT_BENDING = 10.0
"""Bending stiffness of the fully supported puff, as a multiple of the fabric's."""


def support_weights(panels: Sequence[Panel], body: Body) -> np.ndarray:
    """Per cloth vertex (panels concatenated): 0 (fabric alone) … 1 (puff held by its interlining)."""
    weights = np.concatenate([np.zeros(len(p.positions)) for p in panels])
    arm = body.positions if body.arm_weights is None else body.positions[body.arm_weights >= 0.5]
    legs = body.positions if body.arm_weights is None else body.positions[body.arm_weights < 0.5]
    offset = 0
    for p in panels:
        if p.zone in SUPPORTED and len(arm):
            _, d = nearest_growing(p.positions, arm, (0.02, 0.05, 0.15))
            w = np.clip((d - NO_SUPPORT_UNDER) / (FULL_SUPPORT_AT - NO_SUPPORT_UNDER), 0.0, 1.0)
            weights[offset : offset + len(p.positions)] = np.where(np.isfinite(d), w, 1.0)
        elif p.zone == "skirt" and len(legs):
            # A bell skirt stands off the legs over its petticoat: it keeps its flare, falling into broad folds.
            _, d = nearest_growing(p.positions, legs, (0.05, 0.15, 0.5))
            w = np.clip((d - SKIRT_NO_SUPPORT_UNDER) / (SKIRT_FULL_SUPPORT_AT - SKIRT_NO_SUPPORT_UNDER), 0.0, 1.0)
            weights[offset : offset + len(p.positions)] = SKIRT_SHARE * np.where(np.isfinite(d), w, 1.0)
        offset += len(p.positions)
    return weights
