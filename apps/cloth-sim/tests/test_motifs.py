from __future__ import annotations

import numpy as np

from cloth_sim.motifs import (
    EMBROIDERY_SIZE,
    SMOCK_SIZE,
    embroidery_pixels,
    smock_height,
    smocking_heights,
    to_blender_pixels,
)


def test_embroidery_is_thread_on_a_see_through_ground() -> None:
    px = embroidery_pixels()
    assert px.shape == (EMBROIDERY_SIZE, EMBROIDERY_SIZE, 4)
    share = (px[..., 3] > 0.5).mean()
    assert 0.08 < share < 0.5
    # Thread is shaded (satin), never black: the thread colour dyes it. The ground is empty.
    assert px[..., 0][px[..., 3] > 0.8].min() > 0.7
    assert (px[..., :3][px[..., 3] == 0] == 0).all()


def test_embroidery_is_deterministic_and_tiles_seamlessly() -> None:
    px = embroidery_pixels()
    assert np.array_equal(px, embroidery_pixels())
    left, right = px[:, 0, 3], px[:, -1, 3]
    assert np.abs(left - right).mean() < 40 / 255


def test_smocking_puffs_in_the_diamonds_and_draws_in_at_the_stitches() -> None:
    assert smock_height(0, 0) < 0.15 and smock_height(0.5, 0.5) < 0.15
    assert smock_height(0.5, 0) > 0.8 and smock_height(0, 0.5) > 0.8
    assert np.isclose(smock_height(0.3, 0.2), smock_height(1.3, 2.2))
    h = smocking_heights()
    assert h.shape == (SMOCK_SIZE, SMOCK_SIZE) and 0 <= h.min() and h.max() <= 1
    # Seamless: the first and last rows / columns are neighbours.
    assert np.abs(h[0] - h[-1]).max() < 0.2 and np.abs(h[:, 0] - h[:, -1]).max() < 0.2


def test_blender_pixels_are_flipped_rows_of_rgba_floats() -> None:
    tile = np.zeros((2, 2))
    tile[0, 0] = 1.0  # top-left
    out = to_blender_pixels(tile)
    assert out.dtype == np.float32 and out.shape == (16,)
    # Blender's row 0 is the bottom: the top-left pixel is the third one.
    assert out[8:12].tolist() == [1.0, 1.0, 1.0, 1.0]
    assert to_blender_pixels(np.ones((2, 2, 4))).shape == (16,)
