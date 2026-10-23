"""All panels merged into one cloth mesh (Blender sews only within one object)."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, replace

import numpy as np

from .job import Panel


@dataclass(frozen=True)
class ClothMesh:
    positions: np.ndarray  # (n, 3)
    faces: np.ndarray  # (t, 3), global vertex indices
    face_panel: np.ndarray  # (t,), index of the panel each triangle belongs to
    uvs: np.ndarray  # (n, 2)
    offsets: np.ndarray  # (len(panels) + 1,), first global vertex of each panel


WELD_DISTANCE = 0.003
"""Edges shorter than this (m) are collapsed: the drape repeats seam points and squeezes rows together, and edges
this short make the solver blow up."""
MIN_TRIANGLE_AREA = 1e-8
"""Triangles smaller than this (m², 0.1 mm side) carry no cloth: a solver step divides by their area."""


def _short_edge_clusters(pos: np.ndarray, faces: np.ndarray, weld: float) -> np.ndarray:
    """Per vertex, the vertex it collapses onto: the lowest index reachable through edges shorter than `weld`.

    Only vertices joined by an edge merge. Welding by distance alone glued the two sheets of a fold (a gathered
    cuff, the pleats of a sleeve) into edges shared by 3–4 triangles, which the solver frays.
    """
    edges = np.unique(np.sort(np.concatenate([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1), axis=0)
    short = edges[np.linalg.norm(pos[edges[:, 0]] - pos[edges[:, 1]], axis=1) < weld]
    root = np.arange(len(pos))
    while len(short):
        lowest = np.minimum(root[short[:, 0]], root[short[:, 1]])
        before = root.copy()
        np.minimum.at(root, short[:, 0], lowest)
        np.minimum.at(root, short[:, 1], lowest)
        root = root[root]
        if np.array_equal(root, before):
            break
    # A run of short edges (a squeezed row) must not shrink to one point: only what lies within `weld` merges.
    return np.where(np.linalg.norm(pos - pos[root], axis=1) <= weld, root, np.arange(len(pos)))


def clean_panel(panel: Panel, weld: float = WELD_DISTANCE) -> Panel:
    """Collapses very short edges and drops degenerate triangles (zero-length edges blow up the solver)."""
    pos = panel.positions
    remap = _short_edge_clusters(pos, panel.indices, weld)
    used, compact = np.unique(remap, return_inverse=True)
    faces = compact.ravel()[panel.indices]
    a, b, c = pos[used][faces[:, 0]], pos[used][faces[:, 1]], pos[used][faces[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    distinct = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 0] != faces[:, 2])
    faces = faces[distinct & (area > MIN_TRIANGLE_AREA)]
    # Two triangles on the same three vertices (a fold squeezed flat by the weld): keep one.
    _, once = np.unique(np.sort(faces, axis=1), axis=0, return_index=True)
    faces = faces[np.sort(once)]
    # Drop vertices no triangle uses any more.
    kept, faces_c = np.unique(faces, return_inverse=True)
    return replace(
        panel,
        positions=pos[used][kept],
        indices=faces_c.reshape(-1, 3),
        uvs=panel.uvs[used][kept],
        accent=None if panel.accent is None else panel.accent[used][kept],
    )


def merge_panels(panels: Sequence[Panel]) -> ClothMesh:
    offsets = np.cumsum([0] + [len(p.positions) for p in panels])
    return ClothMesh(
        positions=np.concatenate([p.positions for p in panels]),
        faces=np.concatenate([p.indices + offsets[i] for i, p in enumerate(panels)]),
        face_panel=np.concatenate([np.full(len(p.indices), i, dtype=np.int64) for i, p in enumerate(panels)]),
        uvs=np.concatenate([p.uvs for p in panels]),
        offsets=offsets,
    )


def seam_gaps(positions: np.ndarray, pairs: np.ndarray) -> np.ndarray:
    """Distance (m) between the two vertices of each seam pair: how well the sewing closed."""
    if len(pairs) == 0:
        return np.zeros(0)
    return np.linalg.norm(positions[pairs[:, 0]] - positions[pairs[:, 1]], axis=1)


def surface_area(positions: np.ndarray, faces: np.ndarray) -> float:
    a, b, c = positions[faces[:, 0]], positions[faces[:, 1]], positions[faces[:, 2]]
    return float(0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1).sum())


def connected_components(indices: np.ndarray, vertices: int) -> np.ndarray:
    """Per vertex, a label shared by the vertices joined through triangles (the lowest index of the part)."""
    label = np.arange(vertices)
    if len(indices) == 0:
        return label
    a = np.concatenate([indices[:, 0], indices[:, 1], indices[:, 2]])
    b = np.concatenate([indices[:, 1], indices[:, 2], indices[:, 0]])
    while True:
        lowest = np.minimum(label[a], label[b])
        before = label.copy()
        np.minimum.at(label, a, lowest)
        np.minimum.at(label, b, lowest)
        label = label[label]
        if np.array_equal(label, before):
            return label
