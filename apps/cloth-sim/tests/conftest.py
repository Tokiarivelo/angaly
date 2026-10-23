from __future__ import annotations

from typing import Any

import numpy as np
import pytest

from cloth_sim.job import Panel


def grid(
    rows: int, cols: int, *, origin: tuple[float, float, float] = (0.0, 0.0, 0.0), step: float = 0.01
) -> tuple[np.ndarray, np.ndarray]:
    """A flat (x, y) grid of rows × cols vertices at z = origin[2], two triangles per cell."""
    ys, xs = np.mgrid[0:rows, 0:cols]
    pos = np.stack([xs.ravel() * step, ys.ravel() * step, np.zeros(rows * cols)], axis=1) + np.array(origin)
    tris = []
    for r in range(rows - 1):
        for c in range(cols - 1):
            v = r * cols + c
            tris += [[v, v + 1, v + cols], [v + 1, v + cols + 1, v + cols]]
    return pos, np.array(tris, dtype=np.int64)


def panel(pid: str, zone: str, rows: int = 4, cols: int = 4, **kw: Any) -> Panel:
    pos, idx = grid(rows, cols, **kw)
    return Panel(id=pid, zone=zone, role="front", positions=pos, indices=idx, uvs=pos[:, :2].copy())


@pytest.fixture
def raw_job() -> dict[str, Any]:
    pos, idx = grid(3, 3)
    return {
        "version": 1,
        "units": "m",
        "pose": "PRESENTATION",
        "fabric": {"behavior": "FLUIDE"},
        "source": {"versionId": "v1"},
        "body": {"positions": pos.ravel().tolist(), "indices": idx.ravel().tolist()},
        "panels": [
            {
                "id": "bodice-front",
                "zone": "bodice",
                "role": "front",
                "positions": pos.ravel().tolist(),
                "indices": idx.ravel().tolist(),
                "uvs": pos[:, :2].ravel().tolist(),
            }
        ],
    }
