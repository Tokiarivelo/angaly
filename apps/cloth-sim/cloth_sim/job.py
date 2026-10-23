"""Cloth-sim job: the draped panels and the posed body exported by tools/export-job.ts.

Pure Python + numpy (runs inside Blender's interpreter as well as under pytest).
Every array is checked before Blender is started: a malformed job fails here, with a reason.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

JOB_VERSION = 1
MOTIFS = ("BRODERIE", "SMOCKS")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


class JobError(ValueError):
    """The job cannot be simulated (malformed input)."""


@dataclass(frozen=True)
class Panel:
    id: str
    zone: str
    role: str
    positions: np.ndarray  # (n, 3) float, metres
    indices: np.ndarray  # (t, 3) int
    uvs: np.ndarray  # (n, 2) float, metres on the flat fabric
    accent: np.ndarray | None = None
    """(n,) bool: vertices cut in the accent fabric (a sleeve's puff), when part of the panel is."""
    motif: str | None = None
    """A detail drawn as a motif instead of plain cloth (pattern-engine `DetailArea.motif`): BRODERIE or SMOCKS."""
    trim_color: str | None = None
    """Its thread colour (#rrggbb), when the pattern gave one."""


@dataclass(frozen=True)
class Body:
    positions: np.ndarray  # (n, 3), in the dressing pose the garment is draped on
    indices: np.ndarray  # (t, 3)
    target: np.ndarray | None = None
    """(n, 3): the same body in the requested pose, reached during the simulation (None: no pose change)."""
    arm_weights: np.ndarray | None = None
    """(n,): how much each vertex belongs to an arm (0 torso … 1 arm), from the human mesh."""

    @property
    def final(self) -> np.ndarray:
        """The body as it stands at the end of the simulation."""
        return self.positions if self.target is None else self.target


@dataclass(frozen=True)
class Hair:
    positions: np.ndarray  # (n, 3)
    indices: np.ndarray  # (t, 3)
    uvs: np.ndarray  # (n, 2): u around a lock, v along it (0 root … 1 tip)
    shade: np.ndarray  # (n,): light factor (roots and the underside of each lock darker)
    alpha: np.ndarray  # (n,): coverage (cut under ½: the scalp layer's edge)


@dataclass(frozen=True)
class Head:
    """The head as the viewer shows it: skin colours (lips, brows, lash line), hair, eyeballs. Render only."""

    skin_colors: np.ndarray  # (body vertices, 3), linear RGB
    hair_color: str
    hair: Hair | None
    eye_radius: float
    eye_centre: np.ndarray  # (3,): the left (+x) eye; the right one is its mirror image


@dataclass(frozen=True)
class Job:
    pose: str
    fabric_behavior: str | None
    body: Body
    panels: list[Panel]
    source: dict[str, Any]
    look: dict[str, Any] = field(default_factory=dict)
    """The fabric read off the photo (`GarmentFit` look fields: colours, prints, finish, motif size)."""
    head: Head | None = None


def _triplets(values: Any, what: str, width: int, dtype: type) -> np.ndarray:
    arr = np.asarray(values, dtype=dtype)
    if arr.ndim != 1 or arr.size == 0 or arr.size % width:
        raise JobError(f"{what}: expected a non-empty flat list of {width}-tuples")
    return arr.reshape(-1, width)


def _mesh(raw: dict[str, Any], what: str) -> tuple[np.ndarray, np.ndarray]:
    positions = _triplets(raw.get("positions"), f"{what}.positions", 3, np.float64)
    indices = _triplets(raw.get("indices"), f"{what}.indices", 3, np.int64)
    if not np.isfinite(positions).all():
        raise JobError(f"{what}.positions: non-finite coordinate")
    if indices.min() < 0 or indices.max() >= len(positions):
        raise JobError(f"{what}.indices: vertex index out of range")
    return positions, indices


def _per_vertex(values: Any, n: int, what: str) -> np.ndarray:
    arr = np.asarray(values, dtype=np.float64).reshape(-1)
    if arr.shape != (n,) or not np.isfinite(arr).all():
        raise JobError(f"{what}: one finite value per vertex expected")
    return arr


def _head(raw: Any, body_vertices: int) -> Head | None:
    if raw is None:
        return None
    colors = _triplets(raw.get("skinColors"), "head.skinColors", 3, np.float64)
    if len(colors) != body_vertices or not np.isfinite(colors).all():
        raise JobError("head.skinColors: one finite colour per body vertex expected")
    hair = None
    if raw.get("hair") is not None:
        pos, idx = _mesh(raw["hair"], "head.hair")
        uvs = _triplets(raw["hair"].get("uvs"), "head.hair.uvs", 2, np.float64)
        if len(uvs) != len(pos):
            raise JobError("head.hair.uvs: one uv per vertex expected")
        n = len(pos)
        shade = _per_vertex(raw["hair"].get("shade"), n, "head.hair.shade")
        alpha = _per_vertex(raw["hair"].get("alpha"), n, "head.hair.alpha")
        hair = Hair(positions=pos, indices=idx, uvs=uvs, shade=shade, alpha=alpha)
    eyes = raw.get("eyes") or {}
    centre = np.asarray(eyes.get("centre", [0, 0, 0]), dtype=np.float64)
    radius = float(eyes.get("radius", 0.0))
    if centre.shape != (3,) or not np.isfinite(centre).all() or not 0 <= radius < 0.05:
        raise JobError("head.eyes: a centre (x, y, z) and a radius under 5 cm expected")
    color = str(raw.get("hairColor") or "#4a3324")
    return Head(skin_colors=colors, hair_color=color, hair=hair, eye_radius=radius, eye_centre=centre)


def parse_job(raw: dict[str, Any]) -> Job:
    if raw.get("version") != JOB_VERSION:
        raise JobError(f"unsupported job version {raw.get('version')!r}")
    if raw.get("units") != "m":
        raise JobError("units must be metres ('m')")
    body_pos, body_idx = _mesh(raw.get("body") or {}, "body")
    target = None
    if raw.get("targetBody") is not None:
        target = _triplets((raw["targetBody"] or {}).get("positions"), "targetBody.positions", 3, np.float64)
        if target.shape != body_pos.shape:
            raise JobError("targetBody.positions: one position per body vertex expected")
        if not np.isfinite(target).all():
            raise JobError("targetBody.positions: non-finite coordinate")
    arm_weights = None
    if (raw.get("body") or {}).get("armWeights") is not None:
        arm_weights = np.asarray(raw["body"]["armWeights"], dtype=np.float64)
        if arm_weights.shape != (len(body_pos),):
            raise JobError("body.armWeights: one weight per body vertex expected")
    panels: list[Panel] = []
    seen: set[str] = set()
    for i, p in enumerate(raw.get("panels") or []):
        pid = str(p.get("id") or "")
        if not pid or pid in seen:
            raise JobError(f"panels[{i}]: missing or duplicate id {pid!r}")
        seen.add(pid)
        pos, idx = _mesh(p, f"panels[{i}]")
        uvs = _triplets(p.get("uvs"), f"panels[{i}].uvs", 2, np.float64)
        if len(uvs) != len(pos):
            raise JobError(f"panels[{i}].uvs: one uv per vertex expected")
        accent = None
        if p.get("accent") is not None:
            accent = np.asarray(p["accent"], dtype=np.float64).reshape(-1) > 0.5
            if accent.shape != (len(pos),):
                raise JobError(f"panels[{i}].accent: one flag per vertex expected")
        panels.append(
            Panel(
                id=pid,
                zone=str(p.get("zone")),
                role=str(p.get("role")),
                positions=pos,
                indices=idx,
                uvs=uvs,
                accent=accent,
                motif=p.get("motif") if p.get("motif") in MOTIFS else None,
                trim_color=p["trimColor"].lower()
                if isinstance(p.get("trimColor"), str) and _HEX.match(p["trimColor"])
                else None,
            )
        )
    if not panels:
        raise JobError("no panel to simulate")
    fabric = raw.get("fabric") or {}
    return Job(
        pose=str(raw.get("pose") or "NEUTRE"),
        fabric_behavior=fabric.get("behavior"),
        body=Body(positions=body_pos, indices=body_idx, target=target, arm_weights=arm_weights),
        panels=panels,
        source=dict(raw.get("source") or {}),
        look=dict(raw.get("look") or {}),
        head=_head(raw.get("head"), len(body_pos)),
    )


def load_job(path: str | Path) -> Job:
    with open(path, encoding="utf-8") as f:
        return parse_job(json.load(f))
