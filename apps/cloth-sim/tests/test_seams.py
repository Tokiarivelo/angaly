from __future__ import annotations

import numpy as np

from cloth_sim.job import Panel
from cloth_sim.seams import boundary_vertices, find_seams

from .conftest import grid, panel


def test_boundary_vertices_are_the_outline() -> None:
    _, idx = grid(4, 4)
    b = boundary_vertices(idx)
    assert len(b) == 12  # 4×4 grid: all but the 4 inner vertices
    assert not set(b.tolist()) & {5, 6, 9, 10}


def test_sews_side_by_side_outlines() -> None:
    # Two 4×4 panels (3 cm wide), the second one 5 mm to the right of the first: a side seam.
    front = panel("front", "bodice")
    back = panel("back", "bodice", origin=(0.035, 0.0, 0.0))
    s = find_seams([front, back])
    assert s.tacks == 0
    assert len(s.pairs) == 4
    # Each pair joins the right edge of the front (x = 3 cm) to the left edge of the back (global index ≥ 16).
    for a, b in s.pairs.tolist():
        assert a < 16 <= b
        assert abs(front.positions[a][0] - 0.03) < 1e-9
        assert abs(back.positions[b - 16][0] - 0.035) < 1e-9


def test_panels_far_apart_are_not_sewn() -> None:
    s = find_seams([panel("a", "bodice"), panel("b", "bodice", origin=(0.2, 0.0, 0.0))])
    assert s.pairs.shape == (0, 2)
    assert s.tacks == 0


def test_a_layer_lying_on_a_panel_is_tacked_onto_its_cloth() -> None:
    # A small revers (3×3, 2 cm) lying 4 mm above the middle of a large front (9×9, 8 cm).
    front = panel("front", "bodice", 9, 9)
    revers = panel("revers", "revers", 3, 3, origin=(0.03, 0.03, 0.004))
    s = find_seams([front, revers])
    assert len(s.pairs) == 8  # the revers' 8 outline vertices, each onto the front's cloth
    assert s.tacks == 8
    inner_front = set(range(81)) - set(boundary_vertices(front.indices).tolist())
    assert all(a in inner_front for a, _ in s.pairs.tolist())


def test_the_sleeve_cap_reaches_the_armhole_across_a_wider_gap() -> None:
    bodice = panel("bodice", "bodice")
    sleeve = panel("sleeve", "sleeve", origin=(0.08, 0.0, 0.0))  # 5 cm off the bodice's edge
    assert find_seams([bodice, sleeve], zone_gaps={}, anchor=False).pairs.size == 0
    s = find_seams([bodice, sleeve])
    # Only the sleeve's outline looks that far: one spring per sleeve vertex in reach, onto the bodice's near edge.
    bodice_ends, sleeve_ends = s.pairs.min(axis=1), s.pairs.max(axis=1) - 16
    assert len(set(sleeve_ends.tolist())) == len(s.pairs) > 0
    assert np.allclose(bodice.positions[bodice_ends][:, 0], 0.03)


def test_only_the_cap_row_reaches_across_the_wide_gap() -> None:
    # The sleeve's rows run along its flat v (here its y): the cap is the first row, the free end the last one.
    bodice = panel("bodice", "bodice")
    sleeve = panel("sleeve", "sleeve", origin=(0.08, 0.0, 0.0))
    s = find_seams([bodice, sleeve])
    sleeve_ends = s.pairs.max(axis=1) - 16
    assert len(sleeve_ends) > 0
    np.testing.assert_allclose(sleeve.uvs[sleeve_ends, 1], 0.0)  # its sides and its free end stay loose


def test_a_sleeve_free_end_is_never_sewn_to_the_bodice() -> None:
    # A short sleeve whose hem lies against the bodice (1 cm off, within the narrow gap): only its cap is sewn.
    bodice = panel("bodice", "bodice", rows=8)
    sleeve = panel("sleeve", "sleeve", origin=(0.04, 0.0, 0.0))
    flipped = Panel(
        id="sleeve",
        zone="sleeve",
        role="front",
        positions=sleeve.positions,
        indices=sleeve.indices,
        uvs=np.stack([sleeve.uvs[:, 0], 0.03 - sleeve.uvs[:, 1]], axis=1),
    )
    for sl in (sleeve, flipped):
        s = find_seams([bodice, sl], anchor=False)
        sleeve_ends = s.pairs.max(axis=1) - 32
        assert len(sleeve_ends) > 0
        # Neither the sleeve's free end reaches the bodice nor the bodice's outline reaches the free end.
        assert (sl.uvs[sleeve_ends, 1] < sl.uvs[:, 1].max() - 1e-6).all()
    # The cuff side of the free end is not affected: a cuff is still sewn onto it.
    cuff = panel("cuff", "cuff", origin=(0.04, 0.04, 0.0))
    s = find_seams([sleeve, cuff], anchor=False)
    assert (sleeve.uvs[s.pairs.min(axis=1), 1] >= 0.03 - 1e-6).any()


def test_the_wide_gap_is_one_way() -> None:
    bodice = panel("bodice", "bodice")
    sleeve = panel("sleeve", "sleeve", origin=(0.08, 0.0, 0.0))
    # Widened from the bodice side only: the bodice's outline reaches out, onto the sleeve's near edge.
    s = find_seams([bodice, sleeve], zone_gaps={("bodice", "sleeve"): 0.07})
    bodice_ends, sleeve_ends = s.pairs.min(axis=1), s.pairs.max(axis=1) - 16
    assert len(set(bodice_ends.tolist())) == len(s.pairs) > 0
    assert np.allclose(sleeve.positions[sleeve_ends][:, 0], 0.08)


def test_arms_are_never_sewn_to_the_skirt() -> None:
    # A hand resting on the skirt in the presentation pose brings the cuff right onto it.
    skirt = panel("skirt", "skirt")
    cuff = panel("cuff", "cuff", origin=(0.035, 0.0, 0.0))
    assert find_seams([skirt, cuff]).pairs.size == 0  # not even anchored to it
    assert find_seams([skirt, cuff], never_sewn=frozenset()).pairs.size > 0


def test_pairs_are_unique_and_ordered() -> None:
    s = find_seams([panel("a", "bodice"), panel("b", "bodice", origin=(0.035, 0.0, 0.0))])
    assert (s.pairs[:, 0] < s.pairs[:, 1]).all()
    assert len({tuple(p) for p in s.pairs.tolist()}) == len(s.pairs)


def test_a_panel_without_outline_is_skipped() -> None:
    # A closed surface (tetrahedron): every edge shared by two triangles, nothing to sew from.
    from cloth_sim.job import Panel

    pos = np.array([[0, 0, 0], [0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]], float)
    idx = np.array([[0, 2, 1], [0, 1, 3], [1, 2, 3], [0, 3, 2]])
    closed = Panel(id="c", zone="bodice", role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy())
    assert len(boundary_vertices(idx)) == 0
    s = find_seams([closed, panel("b", "bodice", origin=(0.2, 0.0, 0.0))])
    assert s.pairs.size == 0


def test_a_part_sewn_to_nothing_is_anchored_to_the_nearest_cloth() -> None:
    # A bow's loop lying 3 cm over the belt: too far for a seam, it would fall forever.
    belt = panel("belt", "belt", 4, 8)
    loop = panel("loop", "belt", 3, 3, origin=(0.02, 0.0, 0.03))
    assert find_seams([belt, loop], anchor=False).pairs.size == 0
    s = find_seams([belt, loop])
    assert s.anchored == 2  # each one is the other's nearest cloth
    assert 0 < len(s.pairs) <= 2 * 6
    loop_ends = s.pairs.max(axis=1)
    assert (loop_ends >= 32).any()


def test_a_free_edge_is_not_tacked_onto_the_cloth_under_it() -> None:
    # A robe-manteau front over the plastron: its edge hangs free. A revers over the front is stitched down.
    plastron = panel("p", "plastron", 9, 9)
    front = panel("f", "skirt", 3, 3, origin=(0.03, 0.03, 0.004))
    assert find_seams([plastron, front], anchor=False).tacks == 0
    revers = panel("r", "revers", 3, 3, origin=(0.03, 0.03, 0.004))
    assert find_seams([panel("f", "bodice", 9, 9), revers], anchor=False).tacks == 8


def test_the_plastron_is_tacked_under_a_free_edge_never_onto_it() -> None:
    # The plastron's cut edge lies right under the front's free edge (x = 3 cm), 4 mm below it.
    plastron = panel("p", "plastron", 4, 4)
    front = panel("f", "skirt", 4, 6, origin=(0.03, 0.0, 0.004))
    s = find_seams([plastron, front], anchor=False)
    front_outline = set((boundary_vertices(front.indices) + 16).tolist())
    assert s.tacks == len(s.pairs) > 0
    assert not any(b in front_outline for _, b in s.pairs.tolist())


def _two_halves(gap: float, zone: str = "bodice") -> Panel:
    """A panel made of two mirrored halves (as the drape builds front and back): two 4×4 grids side by side, the right
    one `gap` m to the right of the left one, not joined by any triangle."""
    left_pos, left_idx = grid(4, 4)
    right_pos, right_idx = grid(4, 4, origin=(0.03 + gap, 0.0, 0.0))
    pos = np.concatenate([left_pos, right_pos])
    idx = np.concatenate([left_idx, right_idx + len(left_pos)])
    return Panel(id="front", zone=zone, role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy())


def test_the_two_halves_of_a_panel_are_sewn_on_the_centre_line() -> None:
    # Left and right halves meet on the centre line (same points, no triangle between them): without a seam the
    # bodice was two loose flaps and slid down off the shoulders.
    s = find_seams([_two_halves(0.0)])
    assert len(s.pairs) == 4
    for a, b in s.pairs.tolist():
        assert a < 16 <= b  # one point of each half
        assert abs(_two_halves(0.0).positions[a][0] - 0.03) < 1e-9


def test_halves_far_apart_stay_open() -> None:
    # A real opening (a coat's fronts apart over the plastron) is not closed.
    assert find_seams([_two_halves(0.05)], anchor=False).pairs.size == 0


def test_fronts_opening_over_a_plastron_keep_their_halves_apart() -> None:
    # A robe-manteau: the fronts hang free over the plastron, their centre edges are an opening, not a seam.
    plastron = panel("plastron", "plastron", origin=(0.0, 0.0, -0.05))
    s = find_seams([_two_halves(0.0, "bodice"), plastron], anchor=False)
    assert all(not (a < 16 and 16 <= b < 32) for a, b in s.pairs.tolist())
