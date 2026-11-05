from __future__ import annotations

from collections.abc import Callable

import numpy as np

from cloth_sim.job import Body
from cloth_sim.measure_guide import (
    LEOTARD,
    convex_hull_2d,
    find_landmarks,
    girth,
    guides,
    leotard_colors,
    perimeter,
    slice_points,
    smooth,
)

H = 1.68


def _tube(
    start: np.ndarray, end: np.ndarray, radius: Callable[[float], tuple[float, float]], rows: int = 60, around: int = 32
) -> tuple[np.ndarray, np.ndarray]:
    """A closed-ish tube from start to end; radius(t) = (half width along x, half depth along z), t = 0…1."""
    axis = (end - start) / np.linalg.norm(end - start)
    helper = np.array([0.0, 0.0, 1.0]) if abs(axis[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(axis, helper)
    u /= np.linalg.norm(u)
    v = np.cross(axis, u)
    # Keep u along ±x and v along ±z for a vertical tube (widths read as x, depths as z).
    if abs(axis[1]) > 0.9:
        u, v = np.array([1.0, 0.0, 0.0]), np.array([0.0, 0.0, 1.0])
    pts = []
    for t in np.linspace(0, 1, rows):
        a, b = radius(float(t))
        c = start + (end - start) * t
        for k in range(around):
            ang = 2 * np.pi * k / around
            pts.append(c + u * a * np.cos(ang) + v * b * np.sin(ang))
    idx = []
    for r in range(rows - 1):
        for k in range(around):
            p, q = r * around + k, r * around + (k + 1) % around
            idx += [[p, q, p + around], [q, q + around, p + around]]
    return np.array(pts), np.array(idx)


def _mannequin() -> Body:
    """Torso (neck narrow, bust forward, waist narrow, hips wide), two legs, a left arm, a head. Feet at y = 0."""

    def torso(t: float) -> tuple[float, float]:
        y = 0.70 + t * (1.46 - 0.70)  # t = 0 crotch … 1 neck
        bumps = [  # (height, half width, half depth)
            (0.70, 0.12, 0.09),
            (0.82, 0.18, 0.11),  # hip
            (1.04, 0.12, 0.08),  # waist
            (1.15, 0.13, 0.09),
            (1.23, 0.15, 0.13),  # bust
            (1.33, 0.16, 0.10),
            (1.40, 0.10, 0.07),
            (1.46, 0.055, 0.05),  # neck
        ]
        ys = [b[0] for b in bumps]
        return float(np.interp(y, ys, [b[1] for b in bumps])), float(np.interp(y, ys, [b[2] for b in bumps]))

    parts = [_tube(np.array([0, 0.70, 0.0]), np.array([0, 1.46, 0.0]), torso)]
    for side in (1, -1):
        parts.append(
            _tube(
                np.array([0.09 * side, 0.0, 0.0]),
                np.array([0.09 * side, 0.74, 0.0]),
                lambda t: (0.035 + 0.04 * t, 0.04 + 0.03 * t),
            )
        )
    arm = _tube(
        np.array([0.17, 1.38, 0.0]), np.array([0.45, 0.70, 0.12]), lambda t: (0.045 - 0.02 * t, 0.045 - 0.02 * t)
    )
    parts.append(arm)
    parts.append(
        _tube(np.array([0, 1.46, 0.0]), np.array([0, H, 0.0]), lambda t: (0.07 * np.sin(np.pi * (0.2 + 0.8 * t)), 0.08))
    )
    positions, indices, weights = [], [], []
    offset = 0
    for k, (p, i) in enumerate(parts):
        positions.append(p)
        indices.append(i + offset)
        weights.append(np.full(len(p), 1.0 if k == 3 else 0.0))
        offset += len(p)
    pos = np.concatenate(positions)
    w = np.concatenate(weights)
    # The arm's root blends into the torso (weights ½ there): the armpit.
    root = (w == 1.0) & (pos[:, 1] > 1.30)
    w[root] = 0.5
    return Body(positions=pos, indices=np.concatenate(indices), arm_weights=w)


def test_slices_a_triangle_where_its_edges_cross_the_plane() -> None:
    tri = np.array([[[0.0, 0.0, 0.0], [1.0, 2.0, 0.0], [2.0, 0.0, 0.0]]])
    pts = slice_points(tri, np.array([0.0, 1.0, 0.0]), np.array([0.0, 1.0, 0.0]))
    np.testing.assert_allclose(sorted(pts[:, 0]), [0.5, 1.5])
    assert len(slice_points(tri, np.array([0.0, 5.0, 0.0]), np.array([0.0, 1.0, 0.0]))) == 0


def test_the_tape_bridges_hollows() -> None:
    # A square with a notch: the hull ignores the notch's inner corner.
    pts = np.array([[0, 0], [2, 0], [2, 2], [1, 1.2], [0, 2]], dtype=float)
    assert sorted(convex_hull_2d(pts).tolist()) == [0, 1, 2, 4]
    ring = np.array([[np.cos(a), 0.0, np.sin(a)] for a in np.linspace(0, 2 * np.pi, 200, endpoint=False)])
    tape = girth(ring, np.array([0.0, 1.0, 0.0]), lift=0.0)
    assert tape.closed and abs(perimeter(tape) - 2 * np.pi) < 0.01


def test_smoothing_keeps_the_ends_and_irons_out_a_zigzag() -> None:
    line = np.stack([np.linspace(0, 1, 30), np.zeros(30), 0.01 * (-1) ** np.arange(30)], axis=1)
    out = smooth(line)
    np.testing.assert_allclose(out[[0, -1]], line[[0, -1]])
    assert np.abs(out[3:-3, 2]).max() < 0.003
    short = line[:5]
    assert smooth(short) is short


def test_finds_the_landmarks_on_the_mesh() -> None:
    lm = find_landmarks(_mannequin())
    assert abs(lm.height - H) < 1e-6
    assert abs(lm.bust_y - 1.23) < 0.03
    assert abs(lm.waist_y - 1.04) < 0.03
    assert abs(lm.hip_y - 0.82) < 0.03
    assert lm.neck_base_y < lm.neck_y and lm.neck_y > 1.38
    assert lm.knee_y < lm.crotch_y < lm.hip_y
    assert lm.shoulder_tip[0] > 0.1 and lm.wrist[1] < lm.elbow[1] < lm.shoulder_tip[1]


def test_draws_every_measurement_of_the_catalogue() -> None:
    body = _mannequin()
    out = {g.key: g for g in guides(body)}
    for key in (
        "TOUR_POITRINE",
        "TOUR_TAILLE",
        "TOUR_BASSIN",
        "TOUR_COU",
        "TOUR_CUISSE",
        "TOUR_BRAS",
        "TOUR_POIGNET",
        "LONGUEUR_DOS",
        "LONGUEUR_BRAS",
        "CARRURE_DOS",
        "HAUTEUR_TAILLE_SOL",
        "STATURE",
        "PENTE_EPAULE",
        "LONGUEUR_ENFOURCHURE",
    ):
        assert key in out, key
    # Shoulder slope: a level ruler from the neck base, then a vertical drop of 1 to 9 cm (catalogue range).
    ruler, drop = out["PENTE_EPAULE"].paths
    assert abs(ruler.points[0][1] - ruler.points[-1][1]) < 1e-9
    assert 0.01 <= drop.points[0][1] - drop.points[-1][1] <= 0.09
    # Crotch length: from the front waist under the crotch to the back waist, longer than front + back rise.
    rise = out["LONGUEUR_ENFOURCHURE"].paths
    front, back = rise[0].points, rise[-1].points
    assert front[0][2] > back[0][2] and min(p.points[:, 1].min() for p in rise) < front[-1][1]
    assert {g.view for g in out.values()} <= {"FRONT", "BACK", "SIDE"}
    # Girths are closed and close to the tube's ellipse (the hull of an ellipse is the ellipse).
    bust = out["TOUR_POITRINE"].paths[0]
    a, b = 0.15, 0.13
    ellipse = np.pi * (3 * (a + b) - np.sqrt((3 * a + b) * (a + 3 * b)))
    assert bust.closed and abs(perimeter(bust) - ellipse) < 0.04
    assert perimeter(out["TOUR_TAILLE"].paths[0]) < perimeter(out["TOUR_BASSIN"].paths[0])
    # Lengths are open, on the right side of the body, and the stature spans the whole height.
    back = out["LONGUEUR_DOS"].paths[0]
    assert not back.closed and back.points[:, 2].max() < 0
    assert abs(perimeter(out["STATURE"].paths[0]) - H) < 1e-6
    # The thigh is one leg, not both.
    assert out["TOUR_CUISSE"].paths[0].points[:, 0].min() > -0.01


def test_the_leotard_covers_the_torso_not_the_arms_or_the_head() -> None:
    body = _mannequin()
    skin = np.full((len(body.positions), 3), 0.6)
    colors = leotard_colors(body, skin)
    covered = (colors == np.array(LEOTARD)).all(axis=1)
    y = body.positions[:, 1]
    assert covered[(np.abs(y - 1.04) < 0.01) & (body.arm_weights == 0)].all()  # the waist
    assert not covered[y > 1.5].any()  # the head
    assert not covered[body.arm_weights == 1].any()  # the arm
    assert not covered[y < 0.4].any()  # the shins
    np.testing.assert_allclose(skin, 0.6)  # the skin colours are left untouched
