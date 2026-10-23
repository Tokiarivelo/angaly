"""Fabric behaviour (`FabricBehavior` of @angaly/types) → Blender cloth settings.

Starting points taken from Blender's own cloth presets (cotton, silk, denim, leather) for a mesh of
~1–2 cm edges; to be calibrated on photos (phase 4 of docs/features/realistic-render-blender.md).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

REFERENCE_VERTEX_AREA = 1.96e-4
"""Cloth area (m²) per vertex of the mesh the settings were tuned on (phase 1: v2 coat-dress, 3.45 m² over
17 641 vertices). Blender's mass is per vertex: refining a sleeve doubled its weight and it sagged."""


@dataclass(frozen=True)
class ClothParams:
    mass: float  # kg per vertex, at REFERENCE_VERTEX_AREA m² of cloth per vertex
    tension: float
    compression: float
    shear: float
    bending: float
    air_damping: float
    tension_damping: float = 5.0
    bending_damping: float = 0.5

    def as_dict(self) -> dict[str, float]:
        return asdict(self)


FABRICS: dict[str, ClothParams] = {
    # Silk, crêpe, jersey falling in soft folds (Blender « Silk »).
    "FLUIDE": ClothParams(mass=0.15, tension=5, compression=5, shear=5, bending=0.05, air_damping=1),
    # Velvet, wool, cotton twill holding its shape (between « Cotton » and « Denim »). Bending 5, not 2: on the
    # v2 coat-dress (phase 1), 2 let the gigot puffs collapse and the bodice crumple.
    "STRUCTURE": ClothParams(mass=0.4, tension=20, compression=20, shear=15, bending=5.0, air_damping=1),
    # Heavy brocade, stiff taffeta (Blender « Denim »). Calibrated on 5 bench dresses (2026-10-20, docs §19): softer
    # than « Leather » (50/40/20, mass 0.8), the skirts kept their flare better, long sleeves rode up the arms half
    # as much, and a frame took 25 % less time.
    "RIGIDE": ClothParams(mass=0.6, tension=30, compression=30, shear=25, bending=8, air_damping=1),
    # Knit: soft in tension, little bending (stretches over the body).
    "STRETCH": ClothParams(mass=0.25, tension=3, compression=3, shear=3, bending=0.2, air_damping=1),
}

DEFAULT_FABRIC = "STRUCTURE"


def cloth_params(behavior: str | None) -> ClothParams:
    """Unknown or missing behaviour → a medium-weight woven (STRUCTURE)."""
    return FABRICS.get(behavior or DEFAULT_FABRIC, FABRICS[DEFAULT_FABRIC])


def vertex_mass(params: ClothParams, cloth_area: float, vertices: int) -> float:
    """Blender's per-vertex mass for this mesh: the same weight per m² whatever the triangle size."""
    if vertices <= 0 or cloth_area <= 0:
        return params.mass
    return params.mass * (cloth_area / vertices) / REFERENCE_VERTEX_AREA
