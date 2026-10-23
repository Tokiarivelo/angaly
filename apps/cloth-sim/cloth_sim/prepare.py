"""Job → what Blender simulates: clean even panels, seams, layers apart, cloth out of the skin."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .assemble import ClothMesh, clean_panel, merge_panels
from .job import Job, Panel
from .layers import lift_above_floor, lift_out_of_body, overlap_mask, separate_layers, trim_hidden
from .remesh import MAX_EDGE, refine
from .seams import Seams, find_seams


@dataclass(frozen=True)
class Prepared:
    panels: list[Panel]
    cloth: ClothMesh
    seams: Seams
    layer_mask: np.ndarray
    """Per cloth vertex: part of the self-collision group (overlapping layers, stitched points excepted)."""
    start: np.ndarray
    """Cloth positions of the drape once cleaned and refined, before lifting and separating (for the metrics)."""
    trimmed: int
    """Triangles of lower layers cut away under upper ones."""
    lifted: int
    separated: int
    floor: float
    """Height of the floor (the soles of the feet): the hem rests on it."""


def prepare(job: Job, max_edge: float = MAX_EDGE, layers: bool = True, lift: bool = True) -> Prepared:
    panels = [refine(clean_panel(p), max_edge) for p in job.panels]
    trimmed = 0
    if layers:
        panels, trimmed = trim_hidden(panels)
    # Seams and overlaps are read on the drape as it is: lifting and separating move vertices by millimetres.
    seams = find_seams(panels)
    start = merge_panels(panels).positions
    mask = overlap_mask(panels, np.unique(seams.pairs)) if layers else np.zeros(len(start), dtype=bool)
    lifted = 0
    floor = float(job.body.positions[:, 1].min())
    if lift:
        panels, lifted = lift_out_of_body(panels, job.body)
        panels, on_floor = lift_above_floor(panels, floor)
        lifted += on_floor
    separated = 0
    if layers:
        panels, separated = separate_layers(panels, job.body)
    return Prepared(
        panels=panels,
        cloth=merge_panels(panels),
        seams=seams,
        layer_mask=mask,
        start=start,
        trimmed=trimmed,
        lifted=lifted,
        separated=separated,
        floor=floor,
    )
