from __future__ import annotations

import numpy as np
import pytest

from cloth_sim.assemble import clean_panel, connected_components, merge_panels, seam_gaps, surface_area
from cloth_sim.job import Panel

from .conftest import panel


def test_a_clean_panel_is_left_as_it_is() -> None:
    p = panel("a", "bodice", 4, 5)
    c = clean_panel(p)
    np.testing.assert_allclose(c.positions, p.positions)
    np.testing.assert_array_equal(c.indices, p.indices)
    np.testing.assert_allclose(c.uvs, p.uvs)


def test_collapses_short_edges_and_drops_the_triangles_they_flatten() -> None:
    # Vertices 1 and 3 are a seam point repeated by the drape, joined by a 0.1 mm edge of triangle [1, 3, 2].
    pos = np.array([[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0], [0.01, 0, 0.0001], [0.01, 0.01, 0]], float)
    idx = np.array([[0, 1, 2], [3, 4, 2], [1, 3, 2]])
    c = clean_panel(Panel(id="a", zone="bodice", role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy()))
    assert len(c.positions) == 4
    assert len(c.indices) == 2
    assert len(c.uvs) == 4
    assert all(len(set(t)) == 3 for t in c.indices.tolist())


def test_two_sheets_touching_without_an_edge_stay_apart() -> None:
    # The two sheets of a fold, 1 mm apart: welding them would make edges shared by four triangles.
    lower = panel("a", "sleeve", 3, 3)
    upper_pos = lower.positions + np.array([0.0, 0.0, 0.001])
    pos = np.concatenate([lower.positions, upper_pos])
    idx = np.concatenate([lower.indices, lower.indices + 9])
    c = clean_panel(Panel(id="a", zone="sleeve", role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy()))
    assert len(c.positions) == 18
    edges = np.sort(np.concatenate([c.indices[:, [0, 1]], c.indices[:, [1, 2]], c.indices[:, [2, 0]]]), axis=1)
    assert np.unique(edges, axis=0, return_counts=True)[1].max() <= 2


def test_a_run_of_short_edges_does_not_shrink_to_one_point() -> None:
    # A row squeezed by the drape: 1 mm steps over 1 cm; only points within the weld distance of their root merge.
    xs = np.arange(11) * 0.001
    top = np.stack([xs, np.zeros(11), np.zeros(11)], axis=1)
    bottom = top + np.array([0.0, 0.02, 0.0])
    pos = np.concatenate([top, bottom])
    idx = np.array([[i, i + 1, 11 + i] for i in range(10)] + [[i + 1, 12 + i, 11 + i] for i in range(10)])
    c = clean_panel(Panel(id="a", zone="bodice", role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy()))
    assert np.ptp(c.positions[:, 0]) >= 0.009


def test_drops_zero_area_and_duplicate_triangles_and_unused_vertices() -> None:
    pos = np.array([[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0], [0.02, 0, 0], [0.5, 0.5, 0]], float)
    # [0, 1, 3] is collinear; [2, 1, 0] repeats [0, 1, 2]; vertex 4 is used by nothing.
    idx = np.array([[0, 1, 2], [0, 1, 3], [2, 1, 0]])
    c = clean_panel(Panel(id="a", zone="z", role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy()))
    assert len(c.indices) == 1
    assert len(c.positions) == 3


def test_merge_offsets_faces_and_tags_them_with_their_panel() -> None:
    a = panel("a", "bodice", 3, 3)
    b = panel("b", "skirt", 2, 4, origin=(0.0, -0.05, 0.0))
    m = merge_panels([a, b])
    assert m.offsets.tolist() == [0, 9, 17]
    assert m.positions.shape == (17, 3) and m.uvs.shape == (17, 2)
    assert len(m.faces) == len(a.indices) + len(b.indices)
    np.testing.assert_array_equal(m.faces[len(a.indices) :], b.indices + 9)
    assert m.face_panel.tolist() == [0] * len(a.indices) + [1] * len(b.indices)


def test_seam_gaps() -> None:
    pos = np.array([[0, 0, 0], [0.003, 0.004, 0], [1, 1, 1]], float)
    np.testing.assert_allclose(seam_gaps(pos, np.array([[0, 1], [0, 0]])), [0.005, 0.0])
    assert seam_gaps(pos, np.zeros((0, 2), dtype=np.int64)).size == 0


def test_surface_area() -> None:
    p = panel("a", "bodice", 3, 3)  # 2 cm × 2 cm
    assert surface_area(p.positions, p.indices) == pytest.approx(4e-4)


def test_connected_components() -> None:
    a = panel("a", "bodice", 2, 2)
    idx = np.concatenate([a.indices, a.indices + 4])
    label = connected_components(idx, 9)  # vertex 8 belongs to no triangle
    assert len(set(label[:4].tolist())) == 1 and len(set(label[4:8].tolist())) == 1
    assert label[0] != label[4] and label[8] == 8
    assert connected_components(np.zeros((0, 3), dtype=np.int64), 2).tolist() == [0, 1]
