from __future__ import annotations

import numpy as np

from cloth_sim.job import Body, Panel
from cloth_sim.layers import (
    FLOOR_GAP,
    LAYER_GAP,
    SKIN_GAP,
    layer_crossings,
    lift_above_floor,
    lift_out_of_body,
    outward_body_normals,
    overlap_mask,
    restack,
    separate_layers,
    trim_hidden,
    vertex_normals,
)
from cloth_sim.zones import free_edge, loose_over, rank_of, unrelated

from .conftest import grid, panel


def wall(z: float = 0.0, size: int = 21, step: float = 0.01) -> Body:
    """A flat body: a 20 cm square in the plane z (skin facing +z, the body behind it)."""
    pos, idx = grid(size, size, origin=(-0.1, -0.1, z), step=step)
    return Body(positions=pos, indices=idx)


def sheet(pid: str, zone: str, z: float, rows: int = 9, cols: int = 9, x: float = -0.04, y: float = -0.04) -> Panel:
    return panel(pid, zone, rows, cols, origin=(x, y, z))


def test_zone_rules() -> None:
    assert rank_of("plastron") < rank_of("bodice") < rank_of("revers") < rank_of("belt")
    assert rank_of("unknown") == rank_of("skirt")
    assert unrelated("cuff", "skirt") and unrelated("skirt", "sleeve") and not unrelated("sleeve", "bodice")
    assert free_edge("skirt", "plastron") and not free_edge("belt", "skirt")
    assert loose_over("belt") and loose_over("cord") and not loose_over("revers")


def test_body_normals_point_outwards_whatever_the_winding() -> None:
    body = wall()
    # A wall facing +z: its "outside" is +z only if the body lies behind it; build a box-like body around the
    # origin instead: the wall at z = 0.1 is its front, so outwards is +z there.
    front = Body(positions=body.positions + np.array([0, 0, 0.1]), indices=body.indices)
    back = Body(positions=body.positions - np.array([0, 0, 0.1]), indices=body.indices[:, ::-1])
    both = Body(
        positions=np.concatenate([front.positions, back.positions]),
        indices=np.concatenate([front.indices, back.indices + len(front.positions)]),
    )
    flipped = Body(positions=both.positions, indices=both.indices[:, ::-1])
    for b in (both, flipped):
        n = outward_body_normals(b)
        assert (n[: len(front.positions), 2] > 0.99).all()
        assert (n[len(front.positions) :, 2] < -0.99).all()


def test_vertex_normals_are_unit_and_zero_when_unused() -> None:
    pos, idx = grid(2, 2)
    pos = np.concatenate([pos, [[1.0, 1.0, 1.0]]])
    n = vertex_normals(pos, idx)
    np.testing.assert_allclose(np.linalg.norm(n[:4], axis=1), 1.0)
    assert (n[4] == 0).all()


def _box_front_body() -> Body:
    """A body whose front skin is the plane z = 0 (facing +z), backed by a wall at z = -0.2."""
    front, back = wall(0.0), wall(-0.2)
    return Body(
        positions=np.concatenate([front.positions, back.positions]),
        indices=np.concatenate([front.indices, back.indices[:, ::-1] + len(front.positions)]),
    )


def test_lifts_cloth_out_of_the_skin_only_near_it() -> None:
    body = _box_front_body()
    inside = sheet("a", "bodice", -0.005)  # 5 mm under the skin
    outside = sheet("b", "skirt", 0.02)  # 2 cm off it
    deep = sheet("c", "skirt", -0.1)  # far inside (nearest skin point beyond SKIN_REACH): left alone
    (a, b, c), lifted = lift_out_of_body([inside, outside, deep], body)
    np.testing.assert_allclose(a.positions[:, 2], SKIN_GAP)
    np.testing.assert_allclose(b.positions, outside.positions)
    np.testing.assert_allclose(c.positions, deep.positions)
    assert lifted == len(inside.positions)


def test_separates_an_upper_layer_from_the_one_under_it() -> None:
    body = _box_front_body()
    plastron = sheet("p", "plastron", 0.010)
    front = sheet("f", "bodice", 0.011)  # 1 mm over the plastron
    revers = sheet("r", "revers", 0.005)  # crossed 5 mm under both
    (p, f, r), moved = separate_layers([plastron, front, revers], body)
    np.testing.assert_allclose(p.positions, plastron.positions)
    np.testing.assert_allclose(f.positions[:, 2], 0.010 + LAYER_GAP)
    np.testing.assert_allclose(r.positions[:, 2], 0.010 + 2 * LAYER_GAP)
    assert moved == len(front.positions) + len(revers.positions)
    assert layer_crossings([plastron, front, revers], body) > 0
    assert layer_crossings([p, f, r], body) == 0


def test_arms_are_not_layers_of_the_skirt() -> None:
    body = _box_front_body()
    skirt = sheet("s", "skirt", 0.010)
    cuff = sheet("c", "cuff", 0.008)  # a hand resting on the skirt
    (_, c), moved = separate_layers([skirt, cuff], body)
    np.testing.assert_allclose(c.positions, cuff.positions)
    assert moved == 0
    assert trim_hidden([skirt, cuff])[1] == 0


def test_trims_the_part_of_a_lower_layer_hidden_under_an_upper_one() -> None:
    # A wide plastron (21×9, 20 cm) under a front covering its left half and beyond, taller than it.
    plastron = sheet("p", "plastron", 0.010, rows=9, cols=21, x=-0.1)
    front = sheet("f", "bodice", 0.014, rows=11, cols=11, x=-0.15, y=-0.05)
    (p, f), removed = trim_hidden([plastron, front])
    assert removed > 0
    assert f is front  # the upper layer is never cut
    # What is left of the plastron starts at the front's edge (x = -0.05), give or take one cell.
    assert p.positions[:, 0].min() >= -0.05 - 0.0101
    assert p.positions[:, 0].max() == np.float64(0.1) or abs(p.positions[:, 0].max() - 0.1) < 1e-9
    assert len(p.uvs) == len(p.positions) and p.indices.max() < len(p.positions)


def test_a_layer_beside_another_is_not_trimmed() -> None:
    plastron = sheet("p", "plastron", 0.010)
    front = sheet("f", "bodice", 0.010, x=0.045)  # side by side, 5 mm apart: a seam, not an overlap
    (p, _), removed = trim_hidden([plastron, front])
    assert removed == 0 and p is plastron


def test_a_fully_hidden_panel_is_dropped_and_slivers_go() -> None:
    small = sheet("p", "plastron", 0.010, rows=3, cols=3, x=0.0, y=0.0)
    big = sheet("f", "bodice", 0.014, rows=15, cols=15, x=-0.05, y=-0.05)
    panels, removed = trim_hidden([small, big])
    assert [p.id for p in panels] == ["f"] and removed == len(small.indices)


def test_overlap_mask_marks_overlaps_but_not_stitched_points() -> None:
    plastron = sheet("p", "plastron", 0.010, rows=3, cols=3)
    front = sheet("f", "bodice", 0.014, rows=3, cols=3)
    far = sheet("g", "bodice", 0.014, rows=3, cols=3, x=0.5)
    mask = overlap_mask([plastron, front, far], stitched=np.array([0]))
    assert not mask[0] and mask[1:18].all() and not mask[18:].any()


def test_cloth_under_the_floor_is_raised_onto_it() -> None:
    high = sheet("h", "skirt", 0.0, y=0.5)
    hem = sheet("s", "skirt", 0.0, y=-0.02)  # rows from y = -0.02 to 0.06
    (h, s), lifted = lift_above_floor([high, hem], floor=0.0)
    assert h is high
    assert s.positions[:, 1].min() == FLOOR_GAP
    low = hem.positions[:, 1] < FLOOR_GAP
    assert lifted == int(low.sum()) > 0
    np.testing.assert_allclose(s.positions[~low], hem.positions[~low])


def test_nothing_is_cut_under_a_bow_or_a_cord() -> None:
    plastron = sheet("p", "plastron", 0.010, rows=9, cols=21, x=-0.1)
    for zone in ("belt", "cord"):
        bow = sheet("b", zone, 0.014, rows=11, cols=11, x=-0.15, y=-0.05)
        (p, _), removed = trim_hidden([plastron, bow])
        assert removed == 0 and p is plastron


def _settled(lower: Panel, upper: Panel) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Both panels one after the other; the upper one's first column sunk 3 mm under the lower one, its second
    resting 2 mm over it (closer than the gap, not crossed). Returns the positions, offsets and the two columns."""
    settled = np.concatenate([lower.positions, upper.positions])
    xs = np.unique(upper.positions[:, 0])
    edge = len(lower.positions) + np.flatnonzero(np.isclose(upper.positions[:, 0], xs[0]))
    near = len(lower.positions) + np.flatnonzero(np.isclose(upper.positions[:, 0], xs[1]))
    settled[edge, 2] = 0.007
    settled[near, 2] = 0.012
    return settled, np.array([0, len(lower.positions), len(settled)]), edge, near


def test_restacks_a_front_that_slid_under_the_plastron() -> None:
    body = _box_front_body()
    plastron = sheet("p", "plastron", 0.010)
    front = sheet("f", "skirt", 0.020)
    settled, offsets, edge, near = _settled(plastron, front)
    before = settled.copy()
    out, moved = restack([plastron, front], offsets, settled, body)
    np.testing.assert_array_equal(settled, before)  # the input is left alone
    # A free edge: everything closer than the gap is set over the plastron, as before the run.
    np.testing.assert_allclose(out[np.concatenate([edge, near]), 2], 0.010 + LAYER_GAP)
    assert moved == len(edge) + len(near)
    np.testing.assert_allclose(out[: offsets[1]], before[: offsets[1]])


def test_restacks_only_the_crossed_part_of_a_stitched_layer() -> None:
    body = _box_front_body()
    front = sheet("f", "bodice", 0.010)
    revers = sheet("r", "revers", 0.020)
    settled, offsets, edge, near = _settled(front, revers)
    out, moved = restack([front, revers], offsets, settled, body)
    np.testing.assert_allclose(out[edge, 2], 0.010 + LAYER_GAP)
    np.testing.assert_allclose(out[near, 2], 0.012)  # at its seam distance: left alone
    assert moved == len(edge)
