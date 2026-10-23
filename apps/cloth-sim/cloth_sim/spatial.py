"""Nearest point within a radius, on a uniform grid (numpy only: Blender's Python has no scipy).

Every search here is bounded (a seam gap, a layer's reach, the skin's): the cloud is hashed into cells of the
radius' size and each query only looks at the 27 cells around its own.
"""

from __future__ import annotations

import itertools

import numpy as np

_OFFSET = 1 << 20
_SPAN = 1 << 21
_NEIGHBOURS = np.array(list(itertools.product((-1, 0, 1), repeat=3)), dtype=np.int64)
_MAX_PAIRS = 4_000_000
"""Candidate pairs checked at once (memory bound, ~100 MB of float64)."""


def _keys(cells: np.ndarray) -> np.ndarray:
    c = cells + _OFFSET
    return (c[:, 0] * _SPAN + c[:, 1]) * _SPAN + c[:, 2]


def nearest_within(points: np.ndarray, cloud: np.ndarray, radius: float) -> tuple[np.ndarray, np.ndarray]:
    """Index of the nearest cloud point and its distance, per point; (-1, inf) when none lies within `radius`."""
    best_i = np.full(len(points), -1, dtype=np.int64)
    best_d = np.full(len(points), np.inf)
    if len(points) == 0 or len(cloud) == 0:
        return best_i, best_d
    cloud_keys = _keys(np.floor(cloud / radius).astype(np.int64))
    order = np.argsort(cloud_keys, kind="stable")
    sorted_keys = cloud_keys[order]
    cells = np.floor(points / radius).astype(np.int64)
    for offset in _NEIGHBOURS:
        keys = _keys(cells + offset)
        lo = np.searchsorted(sorted_keys, keys, "left")
        n = np.searchsorted(sorted_keys, keys, "right") - lo
        # In slices of queries, so that the candidate pairs stay within memory.
        start = 0
        while start < len(points):
            stop = start + max(1, int(np.searchsorted(np.cumsum(n[start:]), _MAX_PAIRS, "right")))
            sl = slice(start, stop)
            counts = n[sl]
            total = int(counts.sum())
            start = stop
            if total == 0:
                continue
            q = np.repeat(np.arange(sl.start, sl.stop), counts)
            first = np.repeat(lo[sl], counts)
            within = np.arange(total) - np.repeat(np.cumsum(counts) - counts, counts)
            c = order[first + within]
            d = np.linalg.norm(points[q] - cloud[c], axis=1)
            # Best candidate per query in this cell.
            by = np.lexsort((d, q))
            q, c, d = q[by], c[by], d[by]
            head = np.concatenate([[True], q[1:] != q[:-1]])
            q, c, d = q[head], c[head], d[head]
            better = d < best_d[q]
            best_i[q[better]] = c[better]
            best_d[q[better]] = d[better]
    far = best_d > radius
    best_i[far] = -1
    best_d[far] = np.inf
    return best_i, best_d


def nearest_growing(
    points: np.ndarray, cloud: np.ndarray, radii: tuple[float, ...] = (0.02, 0.05, 0.15, 0.4)
) -> tuple[np.ndarray, np.ndarray]:
    """`nearest_within` with growing radii, each one only for the points the previous left without a match.

    A single large radius makes large cells, and the search falls back to brute force; most points find a match
    in the first, small one.
    """
    best_i = np.full(len(points), -1, dtype=np.int64)
    best_d = np.full(len(points), np.inf)
    todo = np.arange(len(points))
    for r in radii:
        if len(todo) == 0:
            break
        i, d = nearest_within(points[todo], cloud, r)
        found = i >= 0
        best_i[todo[found]], best_d[todo[found]] = i[found], d[found]
        todo = todo[~found]
    return best_i, best_d
