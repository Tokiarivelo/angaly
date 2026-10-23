from __future__ import annotations

import numpy as np

from cloth_sim.job import Panel
from cloth_sim.petticoat import (
    ABOVE_HEM,
    BELOW_TOP,
    HEM_TAPER_HEIGHT,
    HEM_TAPER_INSET,
    INSET,
    TAPER_HEIGHT,
    TAPER_INSET,
    petticoat,
)

from .conftest import panel


def _cone(pid: str, zone: str, top_r: float, bottom_r: float, top: float = 1.0, bottom: float = 0.0) -> Panel:
    """A truncated cone round the y axis (a flared skirt), 24 around × 11 down."""
    a = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    ys = np.linspace(top, bottom, 11)
    pos = np.array(
        [
            [r * np.sin(t), y, r * np.cos(t)]
            for y, r in zip(ys, np.linspace(top_r, bottom_r, 11), strict=True)
            for t in a
        ]
    )
    idx = []
    for row in range(10):
        for c in range(24):
            v, n = row * 24 + c, row * 24 + (c + 1) % 24
            idx += [[v, n, v + 24], [n, n + 24, v + 24]]
    return Panel(id=pid, zone=zone, role="front", positions=pos, indices=np.array(idx), uvs=pos[:, :2].copy())


def test_lies_inside_the_skirt_below_the_hips() -> None:
    skirt = _cone("s", "skirt", 0.15, 0.5)
    coat = petticoat([skirt, panel("b", "bodice", origin=(0.0, 1.2, 0.0))], hem_taper=0.0)
    assert coat is not None
    pos, idx = coat
    assert pos[:, 1].max() <= 1.0 - BELOW_TOP + 1e-9
    # It stops above the hem (y = 0): the hem falls free.
    assert pos[:, 1].min() >= ABOVE_HEM - 1e-9
    assert idx.max() < len(pos)
    r_coat = np.hypot(pos[:, 0], pos[:, 2])
    # Every petticoat point is INSET inside the skirt at its height.
    r_skirt = 0.15 + (0.5 - 0.15) * (1.0 - pos[:, 1])
    # INSET inside the skirt from TAPER_HEIGHT under its top edge down; further in near that edge, never less.
    low = pos[:, 1] <= 1.0 - BELOW_TOP - TAPER_HEIGHT
    np.testing.assert_allclose(r_coat[low], r_skirt[low] - INSET, atol=1e-6)
    assert (r_coat <= r_skirt - INSET + 1e-6).all()
    t = np.clip((1.0 - BELOW_TOP - pos[:, 1]) / TAPER_HEIGHT, 0, 1)
    expected = INSET + TAPER_INSET * (1 - t * t * (3 - 2 * t))
    np.testing.assert_allclose(r_coat, r_skirt - expected, atol=1e-6)
    assert (r_skirt - r_coat)[pos[:, 1] >= pos[:, 1].max() - 1e-9].min() > INSET + 0.001


def test_its_bottom_edge_fades_in_above_the_hem() -> None:
    skirt = _cone("s", "skirt", 0.15, 0.5)
    rim = petticoat([skirt], hem_taper=0.0)
    coat = petticoat([skirt])
    assert rim is not None and coat is not None
    pos = coat[0]
    np.testing.assert_allclose(pos[:, 1], rim[0][:, 1])  # same extent: only drawn in
    r_skirt = 0.15 + (0.5 - 0.15) * (1.0 - pos[:, 1])
    gap = r_skirt - np.hypot(pos[:, 0], pos[:, 2])
    # Up to HEM_TAPER_INSET further in towards the hem (ABOVE_HEM over it), fading out HEM_TAPER_HEIGHT above that.
    t = np.clip((pos[:, 1] - ABOVE_HEM) / HEM_TAPER_HEIGHT, 0, 1)
    low = pos[:, 1] < 1.0 - BELOW_TOP - TAPER_HEIGHT
    np.testing.assert_allclose(gap[low], INSET + HEM_TAPER_INSET * (1 - t * t * (3 - 2 * t))[low], atol=1e-6)
    assert gap[pos[:, 1] <= pos[:, 1].min() + 1e-9].min() > INSET + 0.005
    middle = (pos[:, 1] >= ABOVE_HEM + HEM_TAPER_HEIGHT) & (pos[:, 1] <= 1.0 - BELOW_TOP - TAPER_HEIGHT)
    assert middle.any()
    np.testing.assert_allclose(gap[middle], INSET, atol=1e-6)
    # Drawn in steadily towards the edge: no step the hem could catch on.
    order = np.argsort(pos[:, 1])
    low = order[pos[order, 1] < ABOVE_HEM + HEM_TAPER_HEIGHT]
    assert (np.diff(gap[low]) <= 1e-9).all()


def test_no_skirt_no_petticoat() -> None:
    assert petticoat([panel("b", "bodice")]) is None
    # A skirt too short to reach below the hips.
    assert petticoat([_cone("s", "skirt", 0.15, 0.2, top=1.0, bottom=0.85)]) is None


def test_the_skirt_plastron_closes_the_ring_but_not_the_bodice_plastron() -> None:
    skirt = _cone("s", "skirt", 0.15, 0.5)
    skirt_plastron = _cone("sp", "plastron", 0.15, 0.5)
    bodice_plastron = _cone("bp", "plastron", 0.1, 0.1, top=1.4, bottom=1.0)
    with_plastron = petticoat([skirt, skirt_plastron, bodice_plastron])
    alone = petticoat([skirt])
    assert with_plastron is not None and alone is not None
    assert len(with_plastron[1]) == 2 * len(alone[1])


def test_the_petticoat_is_cut_away_round_the_hands() -> None:
    skirt = _cone("s", "skirt", 0.15, 0.5)
    whole = petticoat([skirt])
    hand = np.array([[0.0, 0.6, 0.28]])  # by the hip, in front, at the skirt's surface
    cut = petticoat([skirt], hand)
    assert whole is not None and cut is not None
    assert len(cut[1]) < len(whole[1])
    assert (np.linalg.norm(cut[0] - hand, axis=1) > 0.12 - 1e-9).all()
