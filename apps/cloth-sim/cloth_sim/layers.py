"""Layers of cloth and the skin under them, sorted out before the solver starts.

In the drape, a plastron and the fronts open over it, a revers and the front it is stitched on, a cuff and the
sleeve end lie within a millimetre of each other. Left as two sheets, each falls through the other (ivory showing
through the navy velvet). Self-collision does not cure it: on the whole garment it is 2.5× slower and the crossed
starting points stay stuck; restricted to the overlaps it is still 3× slower and the layers still cross (phase 1
bis, docs/features/realistic-render-blender.md §10). So:

1. each zone gets a layer rank (`zones.LAYER_RANK`: plastron under the dress, revers and cuffs over it, belt on top);
2. the part of a lower layer hidden under an upper one is cut away (`trim_hidden`): it is never seen, and with a
   single sheet left nothing can cross. Its new edge is then tacked under the upper layer by `find_seams`;
3. what still overlaps (the band along the cut) is pushed out from the body until the upper layer stands
   `LAYER_GAP` off the lower one (`separate_layers`);
4. cloth started under the skin is lifted onto it (`lift_out_of_body`): the body collider cannot push out cloth
   that begins inside it.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import replace

import numpy as np

from .assemble import connected_components
from .job import Body, Panel
from .seams import boundary_vertices
from .spatial import nearest_growing, nearest_within
from .zones import free_edge, loose_over, rank_of, unrelated

LAYER_GAP = 0.004
"""Gap (m) left between two layers before the solver starts."""
OVERLAP_REACH = 0.012
"""A vertex closer than this (m) to a panel of another rank lies in an overlap."""
SKIN_GAP = 0.003
"""Cloth lifted out of the body stands this far (m) off the skin."""
SKIN_REACH = 0.03
"""Only cloth this close (m) to the skin can be under it: further off, the nearest skin point may face elsewhere
(a skirt in front of the crotch is "behind" the inner thigh's normal without being in the leg)."""
MIN_ISLAND = 40
"""Bits of a lower layer left by the cut with fewer vertices than this are dropped (slivers between a cuff and the
sleeve: they flap and show as frayed cloth)."""
CROSSING_TOLERANCE = 0.002
"""An upper layer counts as crossed under a lower one beyond this depth (m): stitched layers are pulled to zero
distance, and the noise around it is no crossing."""
FLOOR_GAP = 0.004
"""Cloth starting under the floor (a long skirt's back hem) is raised to this height (m) above it."""
BODY_REACH = 0.4
"""Cloth further than this (m) from the body has no outward direction (nothing to separate it from)."""


def _with(panel: Panel, positions: np.ndarray) -> Panel:
    return replace(panel, positions=positions)


def vertex_normals(positions: np.ndarray, indices: np.ndarray) -> np.ndarray:
    """Area-weighted vertex normals (unit length; zero for an unused vertex)."""
    a, b, c = positions[indices[:, 0]], positions[indices[:, 1]], positions[indices[:, 2]]
    face = np.cross(b - a, c - a)
    normals = np.zeros_like(positions)
    for k in range(3):
        np.add.at(normals, indices[:, k], face)
    length = np.linalg.norm(normals, axis=1, keepdims=True)
    return np.divide(normals, length, out=np.zeros_like(normals), where=length > 0)


def outward_body_normals(body: Body) -> np.ndarray:
    """Vertex normals of the body, turned outwards (the mesh's winding is not trusted)."""
    normals = vertex_normals(body.positions, body.indices)
    radial = body.positions - body.positions.mean(axis=0)
    radial[:, 1] = 0  # away from the vertical line through the body's centre
    return normals if (normals * radial).sum() >= 0 else -normals


def _outward(points: np.ndarray, body: Body, normals: np.ndarray, reach: float) -> tuple[np.ndarray, np.ndarray]:
    """Per point: the outward normal of the nearest skin point within `reach` (zero if none), and its index."""
    i, _ = nearest_growing(points, body.positions, tuple(r for r in (0.02, 0.05, 0.15, 0.4) if r < reach) + (reach,))
    n = np.where((i >= 0)[:, None], normals[np.maximum(i, 0)], 0.0)
    return n, i


def _inward(panel: Panel, outline: np.ndarray) -> np.ndarray:
    """Per vertex: for an outline vertex, the direction into the panel (mean of its neighbours − itself); else 0."""
    f = panel.indices
    edges = np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    edges = np.unique(np.sort(edges, axis=1), axis=0)
    total = np.zeros_like(panel.positions)
    count = np.zeros(len(panel.positions))
    for u, v in ((0, 1), (1, 0)):
        np.add.at(total, edges[:, u], panel.positions[edges[:, v]])
        np.add.at(count, edges[:, u], 1)
    inward = np.zeros_like(panel.positions)
    inward[outline] = total[outline] / np.maximum(count[outline], 1)[:, None] - panel.positions[outline]
    return inward


def trim_hidden(panels: Sequence[Panel], reach: float = OVERLAP_REACH) -> tuple[list[Panel], int]:
    """Cuts away the triangles of a panel lying under a higher-ranked panel.

    A vertex is hidden when the nearest vertex of a higher-ranked panel within `reach` is inside that panel, or on
    its outline with the vertex on the inner side of it (under the panel's edge band, not beside it); nothing is cut
    under a loose zone (`zones.LOOSE_OVER`: a bow, a cord). A triangle goes when its three vertices are hidden. A
    panel left with nothing is dropped.
    """
    outlines = [boundary_vertices(p.indices) for p in panels]
    inwards = [_inward(p, o) for p, o in zip(panels, outlines, strict=True)]
    out: list[Panel] = []
    removed = 0
    for pa in panels:
        hidden = np.zeros(len(pa.positions), dtype=bool)
        for b, pb in enumerate(panels):
            if rank_of(pb.zone) <= rank_of(pa.zone) or unrelated(pa.zone, pb.zone) or loose_over(pb.zone):
                continue
            j, _ = nearest_within(pa.positions, pb.positions, reach)
            found = j >= 0
            jj = np.maximum(j, 0)
            on_outline = np.isin(jj, outlines[b])
            inner_side = ((pa.positions - pb.positions[jj]) * inwards[b][jj]).sum(axis=1) > 0
            hidden |= found & (~on_outline | inner_side)
        keep = ~hidden[pa.indices].all(axis=1)
        if not keep.all():
            label = connected_components(pa.indices[keep], len(pa.positions))
            parts, sizes = np.unique(label[np.unique(pa.indices[keep])], return_counts=True)
            small = parts[sizes < MIN_ISLAND]
            keep &= ~np.isin(label[pa.indices[:, 0]], small)
        removed += int((~keep).sum())
        if keep.all():
            out.append(pa)
            continue
        if not keep.any():
            continue
        used, faces = np.unique(pa.indices[keep], return_inverse=True)
        out.append(
            replace(
                pa,
                positions=pa.positions[used],
                indices=faces.reshape(-1, 3),
                uvs=pa.uvs[used],
                accent=None if pa.accent is None else pa.accent[used],
            )
        )
    return out, removed


def lift_out_of_body(panels: Sequence[Panel], body: Body, gap: float = SKIN_GAP) -> tuple[list[Panel], int]:
    """Cloth vertices behind the skin (or closer to it than `gap`) moved out along the skin's normal."""
    normals = outward_body_normals(body)
    out: list[Panel] = []
    lifted = 0
    for p in panels:
        n, i = _outward(p.positions, body, normals, SKIN_REACH)
        depth = ((p.positions - body.positions[np.maximum(i, 0)]) * n).sum(axis=1)
        under = (i >= 0) & (depth < gap)
        pos = p.positions.copy()
        pos[under] += n[under] * (gap - depth[under])[:, None]
        lifted += int(under.sum())
        out.append(_with(p, pos))
    return out, lifted


def lift_above_floor(panels: Sequence[Panel], floor: float, gap: float = FLOOR_GAP) -> tuple[list[Panel], int]:
    """Cloth under the floor (or closer to it than `gap`) raised onto it: the floor collider cannot push up cloth that
    begins under it."""
    out: list[Panel] = []
    lifted = 0
    for p in panels:
        low = p.positions[:, 1] < floor + gap
        if not low.any():
            out.append(p)
            continue
        pos = p.positions.copy()
        pos[low, 1] = floor + gap
        lifted += int(low.sum())
        out.append(_with(p, pos))
    return out, lifted


def _heights_over_lower(pa: Panel, lower: Sequence[Panel], n: np.ndarray, reach: float) -> np.ndarray:
    """Per vertex of `pa`: lowest height (along `n`) over a lower-ranked panel within `reach` (inf if none)."""
    height = np.full(len(pa.positions), np.inf)
    for pb in lower:
        j, _ = nearest_within(pa.positions, pb.positions, reach)
        h = ((pa.positions - pb.positions[np.maximum(j, 0)]) * n).sum(axis=1)
        height = np.where(j >= 0, np.minimum(height, h), height)
    return height


def separate_layers(
    panels: Sequence[Panel], body: Body, gap: float = LAYER_GAP, reach: float = OVERLAP_REACH
) -> tuple[list[Panel], int]:
    """Each panel pushed out from the body until it stands `gap` off any lower-ranked panel it lies over."""
    normals = outward_body_normals(body)
    moved = 0
    out = list(panels)
    # Lowest layers first: a revers is set over the front once the front has been set over the plastron.
    for a in sorted(range(len(out)), key=lambda k: rank_of(out[k].zone)):
        pa = out[a]
        lower = [pb for pb in out if rank_of(pb.zone) < rank_of(pa.zone) and not unrelated(pa.zone, pb.zone)]
        if not lower:
            continue
        n, _ = _outward(pa.positions, body, normals, BODY_REACH)
        push = np.clip(gap - _heights_over_lower(pa, lower, n, reach), 0.0, None)
        pushed = push > 0
        pos = pa.positions.copy()
        pos[pushed] += n[pushed] * push[pushed][:, None]
        moved += int(pushed.sum())
        out[a] = _with(pa, pos)
    return out, moved


def restack(
    panels: Sequence[Panel], offsets: np.ndarray, positions: np.ndarray, body: Body, gap: float = LAYER_GAP
) -> tuple[np.ndarray, int]:
    """The settled cloth (`positions`, the panels' vertices one after the other at `offsets`) with its layers stacked
    again: the run has no self-collision, so an upper layer can slide under a lower one (a skirt front's edge under the
    plastron showed as a ragged edge).

    Over a free edge (`zones.free_edge`: the fronts over the plastron) the upper layer is set `gap` over the lower one
    wherever it lies closer, as before the run: lifting only the crossed vertices left the lower layer showing through
    in specks between them. Over a stitched layer only the crossed vertices move: the others sit a few millimetres
    from it at the seams, and pushing them opened the seams. The tacks holding two layers together end `gap` apart, as
    `prepare` leaves them before the run (pinning them kept 67 crossings round them on the robe v2).
    """
    out = [_with(p, positions[offsets[i] : offsets[i + 1]].copy()) for i, p in enumerate(panels)]
    normals = outward_body_normals(body)
    moved = 0
    for a in sorted(range(len(out)), key=lambda k: rank_of(out[k].zone)):
        pa = out[a]
        lower = [pb for pb in out if rank_of(pb.zone) < rank_of(pa.zone) and not unrelated(pa.zone, pb.zone)]
        if not lower:
            continue
        n, _ = _outward(pa.positions, body, normals, BODY_REACH)
        free = [pb for pb in lower if free_edge(pa.zone, pb.zone)]
        sewn = [pb for pb in lower if not free_edge(pa.zone, pb.zone)]
        push = np.zeros(len(pa.positions))
        if free:
            push = np.clip(gap - _heights_over_lower(pa, free, n, OVERLAP_REACH), 0.0, None)
        if sewn:
            height = _heights_over_lower(pa, sewn, n, OVERLAP_REACH)
            push = np.maximum(push, np.where(height < -CROSSING_TOLERANCE, gap - height, 0.0))
        moved += int((push > 0).sum())
        out[a] = _with(pa, pa.positions + n * push[:, None])
    return np.concatenate([p.positions for p in out]), moved


def overlap_mask(panels: Sequence[Panel], stitched: np.ndarray, reach: float = OVERLAP_REACH) -> np.ndarray:
    """Per global vertex: True where a panel overlaps one of another rank (self-collision group).

    `stitched` lists the global vertices held by a seam or a tack: they are left out of the group.
    """
    offsets = np.cumsum([0] + [len(p.positions) for p in panels])
    mask = np.zeros(offsets[-1], dtype=bool)
    for a, pa in enumerate(panels):
        for pb in panels:
            if rank_of(pa.zone) != rank_of(pb.zone) and not unrelated(pa.zone, pb.zone):
                mask[offsets[a] : offsets[a + 1]] |= nearest_within(pa.positions, pb.positions, reach)[0] >= 0
    mask[stitched] = False
    return mask


def layer_crossings(panels: Sequence[Panel], body: Body, reach: float = OVERLAP_REACH) -> int:
    """Vertices of an upper layer lying under a lower-ranked panel they overlap (the defect layers fix)."""
    normals = outward_body_normals(body)
    crossings = 0
    for pa in panels:
        lower = [pb for pb in panels if rank_of(pb.zone) < rank_of(pa.zone) and not unrelated(pa.zone, pb.zone)]
        if not lower:
            continue
        n, _ = _outward(pa.positions, body, normals, BODY_REACH)
        crossings += int((_heights_over_lower(pa, lower, n, reach) < -CROSSING_TOLERANCE).sum())
    return crossings
