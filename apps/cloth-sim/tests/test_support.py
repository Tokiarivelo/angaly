from __future__ import annotations

import numpy as np

from cloth_sim.job import Body
from cloth_sim.support import FULL_SUPPORT_AT, NO_SUPPORT_UNDER, support_weights

from .conftest import grid, panel


def _arm_body() -> Body:
    """An "arm": a flat strip at z = 0, every vertex an arm vertex but the last row (torso)."""
    pos, idx = grid(5, 5, origin=(-0.02, -0.02, 0.0))
    weights = np.ones(len(pos))
    weights[-5:] = 0.0
    return Body(positions=pos, indices=idx, arm_weights=weights)


def test_puff_cloth_is_supported_fitted_cloth_is_not() -> None:
    body = _arm_body()
    fitted = panel("s1", "sleeve", 2, 2, origin=(0.0, 0.0, 0.01))  # 1 cm off the arm
    puff = panel("s2", "sleeve", 2, 2, origin=(0.0, 0.0, 0.06))  # 6 cm off it
    halfway = panel("s3", "sleeve", 2, 2, origin=(0.0, 0.0, (NO_SUPPORT_UNDER + FULL_SUPPORT_AT) / 2))
    bodice = panel("b", "bodice", 2, 2, origin=(0.0, 0.0, 0.06))  # a bodice is never supported
    w = support_weights([fitted, puff, halfway, bodice], body)
    assert (w[:4] == 0).all()
    assert (w[4:8] == 1).all()
    np.testing.assert_allclose(w[8:12], 0.5, atol=0.01)
    assert (w[12:] == 0).all()


def test_far_from_any_arm_is_fully_supported_and_no_arm_means_none() -> None:
    body = _arm_body()
    far = panel("s", "sleeve", 2, 2, origin=(0.0, 0.0, 1.0))
    assert (support_weights([far], body) == 1).all()
    armless = Body(positions=body.positions, indices=body.indices, arm_weights=np.zeros(len(body.positions)))
    assert (support_weights([far], armless) == 0).all()


def test_without_arm_weights_the_whole_body_is_the_arm() -> None:
    pos, idx = grid(3, 3)
    w = support_weights([panel("s", "sleeve", 2, 2, origin=(0.0, 0.0, 0.06))], Body(positions=pos, indices=idx))
    assert (w == 1).all()


def test_a_bell_skirt_standing_off_the_legs_is_partly_supported() -> None:
    from cloth_sim.support import SKIRT_SHARE

    pos, idx = grid(3, 3)
    legs = Body(positions=pos, indices=idx, arm_weights=np.zeros(len(pos)))
    close = panel("s1", "skirt", 2, 2, origin=(0.0, 0.0, 0.02))
    flared = panel("s2", "skirt", 2, 2, origin=(0.0, 0.0, 0.3))
    w = support_weights([close, flared], legs)
    assert (w[:4] == 0).all()
    np.testing.assert_allclose(w[4:], SKIRT_SHARE)
