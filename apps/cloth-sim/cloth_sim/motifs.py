"""Motifs of a detail area (pattern-engine `DetailArea.motif`) for the Cycles render, as the web preview draws them
(`apps/web/.../ui/motifTextures.ts`, same shapes and scales):

- embroidery: scrolls, tendrils, leaves, flowers and French knots in thread, one tile every 8 cm of cloth;
- smocking: the honeycomb of a smocked panel (puffs in diamonds, drawn in at the stitches), one diamond every 12 mm.

Pure numpy (runs in Blender's Python and under pytest). Every tile joins its neighbours seamlessly.
`scripts/render_look.py` turns them into images sampled on the flat-fabric UVs (metres).
"""

from __future__ import annotations

import math

import numpy as np

EMBROIDERY_TILE_M = 0.08
SMOCK_TILE_M = 0.012
EMBROIDERY_COLOR = "#c9a45c"
"""Thread colour of an embroidery when the pattern gave none (champagne gold), as in the web preview."""
EMBROIDERY_SIZE = 256
SMOCK_SIZE = 128


class _Ink:
    """Thread coverage (0–1) and stitch direction per pixel of a square tile."""

    def __init__(self, n: int) -> None:
        self.n = n
        self.a = np.zeros((n, n))
        self.dir = np.zeros((n, n))
        centres = np.arange(n) + 0.5
        self.px, self.py = np.meshgrid(centres, centres)

    def offsets(self, cx: float, cy: float) -> tuple[np.ndarray, np.ndarray]:
        """Pixel offsets from (cx, cy), the shortest way round the tile."""
        n = self.n
        dx = self.px - cx
        dy = self.py - cy
        return dx - n * np.round(dx / n), dy - n * np.round(dy / n)

    def paint(self, dist: np.ndarray, direction: float) -> None:
        """Lays a shape given by its signed distance (px, < 0 inside), anti-aliased."""
        cover = np.clip(0.5 - dist, 0.0, 1.0)
        more = cover > self.a
        self.a[more] = cover[more]
        self.dir[more] = direction


def _disc(ink: _Ink, cx: float, cy: float, r: float) -> None:
    dx, dy = ink.offsets(cx, cy)
    ink.paint(np.hypot(dx, dy) - r, 0.0)


def _ellipse(ink: _Ink, cx: float, cy: float, a: float, b: float, angle: float) -> None:
    dx, dy = ink.offsets(cx, cy)
    c, s = math.cos(angle), math.sin(angle)
    u = (dx * c + dy * s) / a
    v = (-dx * s + dy * c) / b
    ink.paint((np.hypot(u, v) - 1) * min(a, b), angle + math.pi / 2)


def _stem(ink: _Ink, x0: float, y0: float, x1: float, y1: float, w: float) -> None:
    lx, ly = x1 - x0, y1 - y0
    len2 = lx * lx + ly * ly or 1.0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = ink.offsets(cx, cy)
    px = dx + cx - x0
    py = dy + cy - y0
    t = np.clip((px * lx + py * ly) / len2, 0.0, 1.0)
    ink.paint(np.hypot(px - t * lx, py - t * ly) - w, math.atan2(ly, lx))


def _flower(ink: _Ink, cx: float, cy: float, r: float, turn: float) -> None:
    for p in range(5):
        a = turn + 2 * math.pi * p / 5
        _ellipse(ink, cx + math.cos(a) * r * 0.62, cy + math.sin(a) * r * 0.62, r * 0.55, r * 0.32, a)
    _disc(ink, cx, cy, r * 0.26)


def embroidery_pixels(size: int = EMBROIDERY_SIZE) -> np.ndarray:
    """Embroidery tile (size × size × 4, 0–1, row 0 at the top): satin shading in RGB where the thread lies (the thread
    colour dyes it), coverage in alpha, transparent elsewhere."""
    n = size
    ink = _Ink(n)
    s = n / 256

    def vine(t: float) -> tuple[float, float]:
        return t * n, n * (0.5 + 0.17 * math.sin(2 * math.pi * t))

    steps = 64
    for i in range(steps):
        x0, y0 = vine(i / steps)
        x1, y1 = vine((i + 1) / steps)
        _stem(ink, x0, y0, x1, y1, 2.2 * s)
    for k in range(8):
        t = (k + 0.5) / 8
        x, y = vine(t)
        side = -1 if k % 2 == 0 else 1
        slope = math.atan(0.17 * 2 * math.pi * math.cos(2 * math.pi * t))
        out = slope + side * 0.9
        _ellipse(ink, x + math.cos(out) * 12 * s, y + math.sin(out) * 12 * s, 11 * s, 4.5 * s, out)
        px, py, a = x, y, slope - side * 1.1
        for _ in range(4):
            nx, ny = px + math.cos(a) * 6 * s, py + math.sin(a) * 6 * s
            _stem(ink, px, py, nx, ny, 1.1 * s)
            px, py = nx, ny
            a -= side * 0.75
    _flower(ink, 0.25 * n, 0.33 * n, 22 * s, 0.3)
    _flower(ink, 0.75 * n, 0.67 * n, 22 * s, 1.1)
    _flower(ink, 0.75 * n, 0.2 * n, 12 * s, 0.7)
    _flower(ink, 0.25 * n, 0.8 * n, 12 * s, 0.1)
    for x, y in (
        (0.08, 0.12),
        (0.45, 0.1),
        (0.58, 0.32),
        (0.92, 0.42),
        (0.42, 0.9),
        (0.06, 0.6),
        (0.55, 0.62),
        (0.95, 0.88),
    ):
        _disc(ink, x * n, y * n, 3 * s)
    # Satin stitch: fine lines across each shape catch the light.
    across = (ink.px - 0.5) * np.cos(ink.dir) + (ink.py - 0.5) * np.sin(ink.dir)
    shine = np.where(ink.a > 0, 0.78 + 0.22 * (0.5 + 0.5 * np.sin(across * 1.6)), 0.0)
    return np.stack([shine, shine, shine, ink.a], axis=-1)


def smock_height(u: np.ndarray | float, v: np.ndarray | float) -> np.ndarray:
    """Height of smocked cloth (0 at the stitches, 1 in a puff's middle) at (u, v) in tile units; the stitches sit on
    a diamond lattice, (0, 0) and (½, ½) of each tile, with fine vertical pleats between them."""
    u = np.asarray(u, dtype=np.float64)
    v = np.asarray(v, dtype=np.float64)
    a = u + v
    b = u - v
    puff = np.sin(math.pi * (a - np.floor(a))) * np.sin(math.pi * (b - np.floor(b)))
    pleats = 0.12 * np.abs(np.sin(math.pi * 4 * u))
    return np.clip(np.power(np.maximum(0.0, puff), 0.6) * 0.88 + pleats, 0.0, 1.0)


def smocking_heights(size: int = SMOCK_SIZE) -> np.ndarray:
    """Smocking tile (size × size, 0–1, row 0 at the top): the height map Cycles bumps the cloth with."""
    c = (np.arange(size) + 0.5) / size
    u, v = np.meshgrid(c, c)
    return smock_height(u, v)


def to_blender_pixels(rgba: np.ndarray) -> np.ndarray:
    """A tile (row 0 at the top) as Blender's flat image buffer (row 0 at the bottom, RGBA floats)."""
    if rgba.ndim == 2:
        rgba = np.stack([rgba, rgba, rgba, np.ones_like(rgba)], axis=-1)
    return np.ascontiguousarray(rgba[::-1]).astype(np.float32).ravel()
