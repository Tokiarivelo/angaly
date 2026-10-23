from __future__ import annotations

import numpy as np
import pytest

from cloth_sim.checks import bare_arm
from cloth_sim.job import Body, Panel


def _tube(pid: str, zone: str, radius: float, y0: float, y1: float, centre_x: float = 0.0) -> Panel:
    """A vertical tube (sleeve) around the y axis, 16 around × 6 along."""
    a = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    ys = np.linspace(y0, y1, 6)
    pos = np.array([[centre_x + radius * np.cos(t), y, radius * np.sin(t)] for y in ys for t in a])
    idx = []
    for r in range(5):
        for c in range(16):
            v, n = r * 16 + c, r * 16 + (c + 1) % 16
            idx += [[v, n, v + 16], [n, n + 16, v + 16]]
    return Panel(id=pid, zone=zone, role="sleeve", positions=pos, indices=np.array(idx), uvs=pos[:, :2].copy())


def _arm(centre_x: float = 0.0) -> np.ndarray:
    """Points of an "arm": a thinner cylinder (2 cm) along y, from 0 to 0.5 m."""
    a = np.linspace(0, 2 * np.pi, 12, endpoint=False)
    return np.array([[centre_x + 0.02 * np.cos(t), y, 0.02 * np.sin(t)] for y in np.linspace(0, 0.5, 26) for t in a])


def _body(start: np.ndarray, final: np.ndarray | None = None) -> Body:
    return Body(
        positions=start, indices=np.zeros((0, 3), dtype=np.int64), target=final, arm_weights=np.ones(len(start))
    )


def test_bare_arm() -> None:
    sleeve = _tube("s", "sleeve", 0.04, 0.1, 0.4)
    off = Panel("s", "sleeve", "sleeve", sleeve.positions + np.array([0.3, 0, 0]), sleeve.indices, sleeve.uvs)
    puffed = Panel("s", "sleeve", "sleeve", sleeve.positions * np.array([1.4, 1, 1.4]), sleeve.indices, sleeve.uvs)
    body = _body(_arm())
    assert bare_arm([sleeve], [sleeve], body) == 0.0
    assert bare_arm([sleeve], [puffed], body) == 0.0  # a puff standing further off is no bare arm
    assert bare_arm([sleeve], [off], body) == 1.0
    assert bare_arm([sleeve], [sleeve], Body(_arm(), np.zeros((0, 3), dtype=np.int64))) is None
    assert bare_arm([sleeve], [sleeve], _body(_arm(centre_x=1.0))) is None  # no sleeved skin


def _cone(top_radius: float, bottom_radius: float, height: float = 1.0, zone: str = "skirt") -> Panel:
    """A truncated cone of cloth (rings every cm), y from 0 to `height`."""
    rings, seg = int(height * 100) + 1, 24
    pts = []
    for r in range(rings):
        y = height * r / (rings - 1)
        radius = bottom_radius + (top_radius - bottom_radius) * r / (rings - 1)
        for s in range(seg):
            a = 2 * np.pi * s / seg
            pts.append((radius * np.cos(a), y, radius * np.sin(a)))
    pos = np.array(pts)
    return Panel(
        id=zone, zone=zone, role="front", positions=pos, indices=np.zeros((0, 3), dtype=np.int64), uvs=pos[:, :2]
    )


def test_silhouette_hem_over_waist() -> None:
    from cloth_sim.checks import silhouette

    result = silhouette([_cone(0.15, 0.45)])
    assert result is not None
    # Without a body: narrowest slice between 20 % and 45 % from the top (radius 0.21 at 20 % down); hem ≈ 0.9 m wide.
    assert result["hemCm"] == pytest.approx(90, abs=1)
    assert result["waistCm"] == pytest.approx(42, abs=1)
    assert result["ratio"] == pytest.approx(2.11, abs=0.05)


def _torso(waist_y: float) -> Body:
    """A standing body 1.7 m tall: a column of rings, narrowest at `waist_y`, with two arms (arm weight 1) wide out."""
    pts, weights = [], []
    for y in np.arange(0.0, 1.7, 0.01):
        radius = 0.13 + 0.4 * abs(y - waist_y) ** 1.5
        for s in range(16):
            a = 2 * np.pi * s / 16
            pts.append((radius * np.cos(a), y, radius * np.sin(a)))
            weights.append(0.0)
        if 0.9 < y < 1.4:  # arms hanging at the sides, far wider than the torso
            pts += [(-0.4, y, 0.0), (0.4, y, 0.0)]
            weights += [1.0, 1.0]
    return Body(positions=np.array(pts), indices=np.zeros((0, 3), dtype=np.int64), arm_weights=np.array(weights))


def test_silhouette_measures_the_waist_at_the_body_waist() -> None:
    from cloth_sim.checks import body_waist_height, silhouette

    body = _torso(waist_y=1.05)
    assert body_waist_height(body) == pytest.approx(1.05, abs=0.02)  # the arms are left out
    cone = _cone(0.15, 0.45, height=1.4)  # radius at y = 1.05: 0.45 - 0.30 × 1.05 / 1.4 ≈ 0.225
    result = silhouette([cone], body)
    assert result is not None
    assert result["waistCm"] == pytest.approx(45, abs=1.5)


def test_body_waist_height_needs_a_torso() -> None:
    from cloth_sim.checks import body_waist_height

    arms_only = Body(positions=np.zeros((5, 3)), indices=np.zeros((0, 3), dtype=np.int64), arm_weights=np.ones(5))
    assert body_waist_height(arms_only) is None


def test_silhouette_ignores_sleeves_and_tiny_garments() -> None:
    from cloth_sim.checks import silhouette

    skirt = _cone(0.15, 0.30)
    wide_sleeve = _cone(0.8, 0.8, zone="sleeve")
    assert silhouette([skirt, wide_sleeve]) == silhouette([skirt])
    assert silhouette([wide_sleeve]) is None
    assert silhouette([_cone(0.1, 0.1, height=0.1)]) is None
