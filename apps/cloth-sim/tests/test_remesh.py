from __future__ import annotations

import numpy as np

from cloth_sim.job import Panel
from cloth_sim.remesh import flip_slivers, refine, split_long_edges, triangle_quality

from .conftest import panel


def _edge_lengths(p: Panel) -> np.ndarray:
    f = p.indices
    e = np.unique(np.sort(np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]]), axis=1), axis=0)
    return np.linalg.norm(p.positions[e[:, 0]] - p.positions[e[:, 1]], axis=1)


def _area(p: Panel) -> float:
    a, b, c = (p.positions[p.indices[:, k]] for k in range(3))
    return float(0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1).sum())


def _signed_normals(p: Panel) -> np.ndarray:
    a, b, c = (p.positions[p.indices[:, k]] for k in range(3))
    return np.cross(b - a, c - a)


def test_splits_every_edge_longer_than_the_limit_and_keeps_the_surface() -> None:
    # A 3×3 grid of 4 cm cells: every edge is too long.
    coarse = panel("a", "skirt", 3, 3, step=0.04)
    fine = split_long_edges(coarse, max_edge=0.015)
    assert _edge_lengths(fine).max() <= 0.015 + 1e-12
    assert _area(fine) == np.float64(_area(coarse)) or abs(_area(fine) - _area(coarse)) < 1e-12
    # Winding kept: every triangle faces +z, like the grid's.
    assert (_signed_normals(fine)[:, 2] > 0).all()


def test_split_interpolates_the_uvs_with_the_positions() -> None:
    fine = split_long_edges(panel("a", "skirt", 2, 2, step=0.04), max_edge=0.015)
    np.testing.assert_allclose(fine.uvs, fine.positions[:, :2])


def test_split_keeps_the_mesh_conforming() -> None:
    # Only some edges are long (a thin strip): split triangles must still share whole edges.
    pos = np.array([[0, 0, 0], [0.05, 0, 0], [0, 0.01, 0], [0.05, 0.01, 0]], float)
    strip = Panel(
        id="s", zone="belt", role="trim", positions=pos, indices=np.array([[0, 1, 2], [1, 3, 2]]), uvs=pos[:, :2]
    )
    fine = split_long_edges(strip, max_edge=0.012)
    edges = np.sort(np.concatenate([fine.indices[:, [0, 1]], fine.indices[:, [1, 2]], fine.indices[:, [2, 0]]]), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    # A conforming strip: interior edges used twice, outline edges once, none more.
    assert counts.max() == 2
    assert abs(_area(fine) - 0.0005) < 1e-12


def test_a_short_mesh_is_left_alone() -> None:
    p = panel("a", "bodice", 3, 3)
    assert split_long_edges(p, max_edge=0.05).indices.shape == p.indices.shape


def test_flips_a_needle_pair_into_fair_triangles() -> None:
    # A flat rhombus, long across x, split along its long diagonal: two needle triangles.
    pos = np.array([[0, 0, 0], [0.04, 0, 0], [0.02, 0.003, 0], [0.02, -0.003, 0]], float)
    rhombus = Panel(
        id="r", zone="z", role="front", positions=pos, indices=np.array([[0, 3, 1], [0, 1, 2]]), uvs=pos[:, :2]
    )
    flipped = flip_slivers(rhombus)
    assert triangle_quality(flipped).min() > triangle_quality(rhombus).min()
    assert sorted(map(sorted, flipped.indices.tolist())) == [[0, 2, 3], [1, 2, 3]]
    assert (_signed_normals(flipped)[:, 2] > 0).all() == (_signed_normals(rhombus)[:, 2] > 0).all()
    assert abs(_area(flipped) - _area(rhombus)) < 1e-12


def test_flip_leaves_a_fair_mesh_unchanged() -> None:
    p = panel("a", "bodice", 4, 4)
    np.testing.assert_array_equal(flip_slivers(p).indices, p.indices)


def test_refine_bounds_the_edges() -> None:
    assert _edge_lengths(refine(panel("a", "skirt", 3, 3, step=0.06), max_edge=0.02)).max() <= 0.02 + 1e-12


def test_triangle_quality() -> None:
    equilateral = Panel(
        id="e",
        zone="z",
        role="front",
        positions=np.array([[0, 0, 0], [1, 0, 0], [0.5, np.sqrt(3) / 2, 0]]),
        indices=np.array([[0, 1, 2]]),
        uvs=np.zeros((3, 2)),
    )
    assert triangle_quality(equilateral)[0] == np.float64(1.0) or abs(triangle_quality(equilateral)[0] - 1) < 1e-12


def test_split_carries_the_accent_flags_to_the_new_vertices() -> None:
    from dataclasses import replace

    p = panel("a", "sleeve", 2, 2, step=0.04)
    flagged = replace(p, accent=np.array([True, False, False, False]))
    fine = split_long_edges(flagged, max_edge=0.015)
    assert fine.accent is not None and len(fine.accent) == len(fine.positions)
    assert fine.accent[0] and fine.accent.sum() > 1
