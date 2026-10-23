from __future__ import annotations

import pytest

from cloth_sim.fabric import DEFAULT_FABRIC, FABRICS, cloth_params


@pytest.mark.parametrize("behavior", ["FLUIDE", "STRUCTURE", "RIGIDE", "STRETCH"])
def test_every_fabric_behavior_of_the_shared_types_has_settings(behavior: str) -> None:
    assert cloth_params(behavior) is FABRICS[behavior]


@pytest.mark.parametrize("behavior", [None, "", "VELOURS_INCONNU"])
def test_unknown_behavior_falls_back_to_a_medium_woven(behavior: str | None) -> None:
    assert cloth_params(behavior) is FABRICS[DEFAULT_FABRIC]


def test_stiffer_fabrics_bend_less_and_weigh_more() -> None:
    fluide, structure, rigide = FABRICS["FLUIDE"], FABRICS["STRUCTURE"], FABRICS["RIGIDE"]
    assert fluide.bending < structure.bending < rigide.bending
    assert fluide.mass < structure.mass < rigide.mass


def test_as_dict_lists_every_setting() -> None:
    assert set(cloth_params("FLUIDE").as_dict()) == {
        "mass",
        "tension",
        "compression",
        "shear",
        "bending",
        "air_damping",
        "tension_damping",
        "bending_damping",
    }


def test_vertex_mass_keeps_the_weight_per_square_metre() -> None:
    from cloth_sim.fabric import REFERENCE_VERTEX_AREA, vertex_mass

    p = cloth_params("STRUCTURE")
    assert vertex_mass(p, REFERENCE_VERTEX_AREA * 1000, 1000) == pytest.approx(p.mass)
    # Twice the vertices on the same cloth: each weighs half.
    assert vertex_mass(p, REFERENCE_VERTEX_AREA * 1000, 2000) == pytest.approx(p.mass / 2)
    assert vertex_mass(p, 0.0, 0) == p.mass
