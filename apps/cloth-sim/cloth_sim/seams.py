"""Seams between draped panels, read from the starting drape.

The geometric drape already lays sewn edges side by side (front and back side seams on the same ring,
bodice hem on the skirt's waist…). A boundary vertex of a panel is therefore sewn to the nearest
vertex of another panel when it lies within the gap allowed for that pair of zones:

- outline ↔ outline: a seam (side seam, waist seam, cuff on the sleeve);
- outline ↔ inside of the other panel: a tack (a belt, a revers stitched on; the dress cut away under them,
  see `layers.trim_hidden`). Never from a free edge (`zones.FREE_EDGES`).

A gathered sleeve cap stands several centimetres off the armhole in the drape: the sleeve → bodice
direction gets a wider gap, and the sewing springs draw the cap in onto the armhole (the gathers). Only the cap
row looks that far (`cap_row`); a sleeve's free end is never sewn to the bodice (`free_end`).
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np

from .assemble import connected_components
from .job import Panel
from .spatial import nearest_growing, nearest_within
from .zones import UNRELATED, free_edge

DEFAULT_GAP = 0.015
"""Sewn edges lie this close (m) in the drape."""

ZONE_GAPS: Mapping[tuple[str, str], float] = {
    ("sleeve", "bodice"): 0.07,
    ("sleeve", "torso"): 0.07,
}
"""Wider gaps, from a panel's outline (first zone) to another's (second zone), for edges the drape does not
bring together: the sleeve cap looks for the armhole. One way only: the bodice's shoulder and neckline
points must not reach out to the sleeve."""

ROW_TOLERANCE = 0.001
"""A sleeve's rows run along its flat `v` (m, cap at the smallest, free end at the largest: `garment-model.ts`); the
outline vertices within this (m) of the first or last row are on it."""

NEVER_SEWN = UNRELATED
"""Zone pairs that only meet by accident of the pose (see `zones.UNRELATED`)."""


def boundary_vertices(indices: np.ndarray) -> np.ndarray:
    """Vertices on an edge used by a single triangle (the panel's outline, holes included)."""
    edges = np.sort(np.concatenate([indices[:, [0, 1]], indices[:, [1, 2]], indices[:, [2, 0]]]), axis=1)
    uniq, counts = np.unique(edges, axis=0, return_counts=True)
    return np.unique(uniq[counts == 1])


def cap_row(panel: Panel, vertices: np.ndarray) -> np.ndarray:
    """Mask over `vertices`: on the panel's first row (a sleeve's cap, set into the armhole)."""
    v = panel.uvs[:, 1]
    return v[vertices] <= float(v.min()) + ROW_TOLERANCE


def free_end(panel: Panel, vertices: np.ndarray) -> np.ndarray:
    """Mask over `vertices`: on the panel's last row (a sleeve's hem or cuff end)."""
    v = panel.uvs[:, 1]
    return v[vertices] >= float(v.max()) - ROW_TOLERANCE


@dataclass(frozen=True)
class Seams:
    pairs: np.ndarray
    """(k, 2) global vertex indices (panels concatenated in job order), a < b, unique."""
    tacks: int
    """How many of the pairs land inside the other panel (not on its outline)."""
    anchored: int = 0
    """Parts sewn to nothing that were anchored to the nearest cloth (a bow's loops)."""


def find_seams(
    panels: Sequence[Panel],
    default_gap: float = DEFAULT_GAP,
    zone_gaps: Mapping[tuple[str, str], float] = ZONE_GAPS,
    never_sewn: frozenset[frozenset[str]] = NEVER_SEWN,
    anchor: bool = True,
) -> Seams:
    offsets = np.cumsum([0] + [len(p.positions) for p in panels])
    boundaries = [boundary_vertices(p.indices) for p in panels]
    pairs: set[tuple[int, int]] = set()
    tacks = 0
    for a, pa in enumerate(panels):
        ba = boundaries[a]
        if len(ba) == 0:
            continue
        pts = pa.positions[ba]
        # Best partner per boundary vertex over all other panels, the gap depending on the zone pair.
        best = np.full(len(ba), np.inf)
        target = np.full(len(ba), -1, dtype=np.int64)
        inside = np.zeros(len(ba), dtype=bool)
        for b, pb in enumerate(panels):
            if b == a or frozenset({pa.zone, pb.zone}) in never_sewn:
                continue
            wide = zone_gaps.get((pa.zone, pb.zone))
            bb = boundaries[b]
            # The cap row only looks for the armhole that far: the rest of a sleeve's outline (a short sleeve's hem,
            # its underarm) lies within the wide gap of the armhole's bottom too, and sewn there it dragged the sleeve
            # through the arm, the shoulder seam forward off the shoulder and the dress 10 cm down
            # (docs/features/realistic-render-blender.md §19). Its free end is sewn to neither side.
            reach = np.full(len(ba), default_gap)
            targets = np.ones(len(pb.positions), dtype=bool)
            if wide is not None:
                reach = np.where(cap_row(pa, ba), wide, default_gap)
                reach[free_end(pa, ba)] = 0.0
            elif zone_gaps.get((pb.zone, pa.zone)) is not None:
                targets[bb[free_end(pb, bb)]] = False
            # A free edge (a robe-manteau's front opening over the plastron) is sewn to nothing under it: pulled down
            # onto that cloth, it sinks into it, and the cloth shows through between the stitches (a scalloped edge).
            # The lower layer's edge is only tacked onto the inside of the upper one, under it.
            free = free_edge(pb.zone, pa.zone)
            if free_edge(pa.zone, pb.zone):
                continue
            # Outline to outline: the panels' own seams (wide gap allowed for the zone pair).
            bb = bb[targets[bb]]
            if reach.max() <= 0:
                continue
            if len(bb) and not free:
                i, d = nearest_within(pts, pb.positions[bb], float(reach.max()))
                ok = (d < best) & (d <= reach)
                best[ok], target[ok], inside[ok] = d[ok], offsets[b] + bb[i[ok]], False
            # Outline onto the other panel's cloth: a layer stitched on (only within the narrow gap).
            cloth = np.arange(len(pb.positions))[targets]
            if free:
                cloth = np.setdiff1d(cloth, boundaries[b])
            i, d = nearest_within(pts, pb.positions[cloth], default_gap)
            ok = (d < best - 1e-9) & (d <= reach)
            best[ok], target[ok], inside[ok] = d[ok], offsets[b] + cloth[np.maximum(i, 0)][ok], True
        for v, t, ins in zip(offsets[a] + ba, target, inside, strict=True):
            if t < 0:
                continue
            key = (int(min(v, t)), int(max(v, t)))
            if key not in pairs:
                pairs.add(key)
                tacks += int(ins)
    _sew_halves(panels, offsets, boundaries, pairs)
    anchored = _anchor_loose_parts(panels, offsets, pairs, never_sewn) if anchor else 0
    arr = np.array(sorted(pairs), dtype=np.int64).reshape(-1, 2)
    return Seams(pairs=arr, tacks=tacks, anchored=anchored)


HALF_GAP = 0.003
"""The two halves of a panel share their centre-line points in the drape: sewn within the 3 mm of `clean_panel`'s weld,
not the 1.5 cm of a seam (that also caught outline points a centimetre off the centre line and puckered the cloth)."""


def _sew_halves(
    panels: Sequence[Panel],
    offsets: np.ndarray,
    boundaries: Sequence[np.ndarray],
    pairs: set[tuple[int, int]],
    gap: float = HALF_GAP,
) -> None:
    """The drape builds a front or a back as two mirrored halves meeting on the centre line (same points, no triangle
    between them). Without a seam there, a bodice was two loose flaps held by the sleeves only and slid down off the
    shoulders (2026-10-19, bench dresses). Each half's outline is sewn to the other half's within `gap`.

    Fronts hanging free over a plastron (a robe-manteau) keep their centre edges open.
    """
    over_plastron = any(p.zone == "plastron" or p.role == "plastron" for p in panels)
    for a, pa in enumerate(panels):
        ba = boundaries[a]
        if len(ba) == 0 or (over_plastron and free_edge(pa.zone, "plastron")):
            continue
        label = connected_components(pa.indices, len(pa.positions))
        parts = np.unique(label[ba])
        if len(parts) < 2:
            continue
        for part in parts:
            mine, others = ba[label[ba] == part], ba[label[ba] != part]
            i, d = nearest_within(pa.positions[mine], pa.positions[others], gap)
            for v, j in zip(mine[np.isfinite(d)], i[np.isfinite(d)], strict=True):
                u, w = int(offsets[a] + v), int(offsets[a] + others[j])
                pairs.add((min(u, w), max(u, w)))


ANCHOR_REACH = 0.1
"""A part sewn to nothing is anchored to cloth within this distance (m)."""
ANCHOR_POINTS = 6
"""Springs anchoring a loose part: its vertices nearest to other cloth."""


def _anchor_loose_parts(
    panels: Sequence[Panel], offsets: np.ndarray, pairs: set[tuple[int, int]], never_sewn: frozenset[frozenset[str]]
) -> int:
    """Parts of a panel with no seam (a bow's loops lying on the belt) fall forever: tie each to the nearest cloth."""
    stitched = np.zeros(offsets[-1], dtype=bool)
    if pairs:
        stitched[np.array(sorted(pairs)).ravel()] = True
    everything = np.concatenate([p.positions for p in panels])
    anchored = 0
    for a, pa in enumerate(panels):
        label = connected_components(pa.indices, len(pa.positions))
        for part in np.unique(label[np.unique(pa.indices)]):
            members = np.where(label == part)[0]
            if stitched[offsets[a] + members].any():
                continue
            others = np.ones(offsets[-1], dtype=bool)
            others[offsets[a] + members] = False
            for b, pb in enumerate(panels):
                if frozenset({pa.zone, pb.zone}) in never_sewn:
                    others[offsets[b] : offsets[b + 1]] = False
            cloud = np.where(others)[0]
            j, d = nearest_growing(pa.positions[members], everything[cloud], (0.02, 0.05, ANCHOR_REACH))
            ok = np.where(j >= 0)[0]
            if len(ok) == 0:
                continue
            for k in ok[np.argsort(d[ok])][:ANCHOR_POINTS].tolist():
                u, v = int(offsets[a] + members[k]), int(cloud[j[k]])
                pairs.add((min(u, v), max(u, v)))
            anchored += 1
    return anchored
