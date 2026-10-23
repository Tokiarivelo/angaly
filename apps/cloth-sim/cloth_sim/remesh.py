"""Even triangles for the solver: long edges split, needle triangles flipped away.

The drape's panels carry edges from 1 mm to 9 cm (stretched gores, a gigot puff, a cuff wrapped round the wrist):
the solver frays the long thin triangles at the edges. Their UVs overlap on wrapped pieces (sleeve, cuff, belt),
so the panels cannot be remeshed on the flat pattern; they are refined in 3D instead:

1. every edge longer than `max_edge` is split at its midpoint (both triangles sharing it, so the mesh stays
   conforming), until none is left — UVs are interpolated with the positions;
2. interior edges are flipped where the two angles facing them add up to more than 180° (a Delaunay flip):
   the slivers left by the splits and by the drape become fair triangles.
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np

from .job import Panel

MAX_EDGE = 0.025
"""Longest edge (m) left in a refined panel. 1.5 cm tripled the cloth (17.6 k → 58.7 k vertices on the v2
coat-dress, ~3× the simulation time) for no visible gain: 2.5 cm only breaks the drape's 3–9 cm outliers."""
MAX_PASSES = 8
"""Each pass halves the longest edges: 8 passes take a 2 m edge below 1 cm."""
FLIP_PASSES = 4


def _edges(faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Unique sorted edges and, per triangle, the index of its edges (v0v1, v1v2, v2v0)."""
    raw = np.sort(np.stack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]], axis=1).reshape(-1, 2), axis=1)
    uniq, inverse = np.unique(raw, axis=0, return_inverse=True)
    return uniq, inverse.reshape(-1, 3)


def split_long_edges(panel: Panel, max_edge: float = MAX_EDGE, passes: int = MAX_PASSES) -> Panel:
    pos, uvs, faces, accent = panel.positions, panel.uvs, panel.indices, panel.accent
    for _ in range(passes):
        edges, tri_edges = _edges(faces)
        long = np.linalg.norm(pos[edges[:, 0]] - pos[edges[:, 1]], axis=1) > max_edge
        if not long.any():
            break
        mid = np.full(len(edges), -1, dtype=np.int64)
        mid[long] = len(pos) + np.arange(long.sum())
        pos = np.concatenate([pos, pos[edges[long]].mean(axis=1)])
        uvs = np.concatenate([uvs, uvs[edges[long]].mean(axis=1)])
        if accent is not None:
            accent = np.concatenate([accent, accent[edges[long]].any(axis=1)])
        out: list[list[int]] = []
        for (a, b, c), (eab, ebc, eca) in zip(faces.tolist(), mid[tri_edges].tolist(), strict=True):
            split = (eab >= 0, ebc >= 0, eca >= 0)
            if split == (False, False, False):
                out.append([a, b, c])
            elif split == (True, True, True):
                out += [[a, eab, eca], [eab, b, ebc], [eca, ebc, c], [eab, ebc, eca]]
            elif sum(split) == 1:
                # Rotate so that the split edge is a→b.
                if split[1]:
                    a, b, c, eab = b, c, a, ebc
                elif split[2]:
                    a, b, c, eab = c, a, b, eca
                out += [[a, eab, c], [eab, b, c]]
            else:
                # Two split edges: rotate so that a→b is the edge left whole.
                if not split[1]:
                    a, b, c, eab, ebc, eca = b, c, a, ebc, eca, eab
                elif not split[2]:
                    a, b, c, eab, ebc, eca = c, a, b, eca, eab, ebc
                out += [[ebc, c, eca], [a, b, ebc], [a, ebc, eca]]
        faces = np.array(out, dtype=np.int64)
    return replace(panel, positions=pos, indices=faces, uvs=uvs, accent=accent)


def _angles_at(p: np.ndarray, q: np.ndarray, r: np.ndarray) -> np.ndarray:
    """Angle at p of each triangle p, q, r (rows)."""
    u, v = q - p, r - p
    return np.arctan2(np.linalg.norm(np.cross(u, v), axis=1), (u * v).sum(axis=1))


def _area(pos: np.ndarray, tri: list[int]) -> float:
    a, b, c = pos[tri[0]], pos[tri[1]], pos[tri[2]]
    return float(0.5 * np.linalg.norm(np.cross(b - a, c - a)))


def flip_slivers(panel: Panel, passes: int = FLIP_PASSES) -> Panel:
    pos = panel.positions
    faces = panel.indices.copy()
    for _ in range(passes):
        edges, tri_edges = _edges(faces)
        # The (at most two) triangles of each edge, and the vertex each one has opposite it.
        flat_edge = tri_edges.ravel()
        flat_tri = np.repeat(np.arange(len(faces)), 3)
        flat_opp = faces[:, [2, 0, 1]].ravel()  # edge k of a triangle (v_k, v_k+1) faces v_k+2
        order = np.argsort(flat_edge, kind="stable")
        counts = np.bincount(flat_edge, minlength=len(edges))
        first = np.concatenate([[0], np.cumsum(counts)[:-1]])
        inner = np.where(counts == 2)[0]
        i1, i2 = order[first[inner]], order[first[inner] + 1]
        t1, t2, o1, o2 = flat_tri[i1], flat_tri[i2], flat_opp[i1], flat_opp[i2]
        u, v = edges[inner, 0], edges[inner, 1]
        facing = _angles_at(pos[o1], pos[u], pos[v]) + _angles_at(pos[o2], pos[u], pos[v])
        candidates = np.where((facing > np.pi + 1e-6) & (o1 != o2))[0]
        if len(candidates) == 0:
            break
        existing = set(map(tuple, edges.tolist()))
        touched: set[int] = set()
        flipped = 0
        for k in candidates[np.argsort(-facing[candidates])].tolist():
            a1, a2, p1, p2 = int(t1[k]), int(t2[k]), int(o1[k]), int(o2[k])
            if a1 in touched or a2 in touched or (min(p1, p2), max(p1, p2)) in existing:
                continue
            # Keep the winding of the first triangle: it walks (p1, a, b); the new pair is (p1, a, p2), (p2, b, p1).
            f1 = faces[a1].tolist()
            i = f1.index(p1)
            a, b = f1[(i + 1) % 3], f1[(i + 2) % 3]
            new1, new2 = [p1, a, p2], [p2, b, p1]
            if min(_area(pos, new1), _area(pos, new2)) < 1e-10:
                continue
            faces[a1], faces[a2] = new1, new2
            touched.update((a1, a2))
            existing.add((min(p1, p2), max(p1, p2)))
            flipped += 1
        if not flipped:
            break
    return replace(panel, indices=faces)


def refine(panel: Panel, max_edge: float = MAX_EDGE) -> Panel:
    return flip_slivers(split_long_edges(panel, max_edge))


def triangle_quality(panel: Panel) -> np.ndarray:
    """Per triangle, 4√3·area / Σ edge² — 1 for an equilateral triangle, 0 for a needle."""
    p, f = panel.positions, panel.indices
    a, b, c = p[f[:, 0]], p[f[:, 1]], p[f[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    sq = ((b - a) ** 2).sum(1) + ((c - b) ** 2).sum(1) + ((a - c) ** 2).sum(1)
    return 4 * np.sqrt(3) * area / np.maximum(sq, 1e-20)
