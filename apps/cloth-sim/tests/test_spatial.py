from __future__ import annotations

import numpy as np
import pytest

from cloth_sim.spatial import nearest_growing, nearest_within


def _brute(points: np.ndarray, cloud: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    d = np.linalg.norm(points[:, None] - cloud[None], axis=2)
    return d.argmin(axis=1), d.min(axis=1)


@pytest.mark.parametrize("radius", [0.02, 0.07, 0.3])
def test_matches_brute_force_within_the_radius(radius: float) -> None:
    rng = np.random.default_rng(7)
    cloud, points = rng.random((3000, 3)), rng.random((800, 3))
    i, d = nearest_within(points, cloud, radius)
    bi, bd = _brute(points, cloud)
    found = bd <= radius
    np.testing.assert_array_equal(i[found], bi[found])
    np.testing.assert_allclose(d[found], bd[found])
    assert (i[~found] == -1).all() and np.isinf(d[~found]).all()


def test_handles_negative_coordinates_and_cell_borders() -> None:
    cloud = np.array([[-0.0099, 0.0, 0.0], [0.03, 0.0, 0.0]])
    i, d = nearest_within(np.array([[0.0001, 0.0, 0.0]]), cloud, 0.01)
    assert i.tolist() == [0] and d[0] == pytest.approx(0.01)


def test_empty_inputs() -> None:
    i, d = nearest_within(np.zeros((0, 3)), np.zeros((4, 3)), 0.1)
    assert i.size == 0 and d.size == 0
    i, d = nearest_within(np.zeros((2, 3)), np.zeros((0, 3)), 0.1)
    assert i.tolist() == [-1, -1]


def test_growing_radii_find_far_points_too() -> None:
    rng = np.random.default_rng(3)
    cloud = rng.random((2000, 3))
    points = np.concatenate([rng.random((200, 3)), rng.random((5, 3)) + 1.2])  # 5 points well outside the cloud
    i, d = nearest_growing(points, cloud, (0.02, 0.1, 2.0))
    bi, bd = _brute(points, cloud)
    np.testing.assert_array_equal(i, bi)
    np.testing.assert_allclose(d, bd)
    i, _ = nearest_growing(points, cloud, (0.02,))
    assert (i[-5:] == -1).all()
