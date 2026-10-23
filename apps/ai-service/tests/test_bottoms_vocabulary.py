"""Bottoms (trousers, skirts): rise, band, closure, pleats, pockets, hem, vent and the leg fit numbers."""
from __future__ import annotations

from app.garment_knowledge import DETAIL_OPTIONS, build_taxonomy_prompt, normalize_profile


def _profile(garment: str, details: dict[str, str], fit: dict | None = None) -> dict:
    return normalize_profile({"isGarment": True, "garmentType": garment, "details": details, **({"fit": fit} if fit else {})})


def test_trouser_details_are_kept() -> None:
    p = _profile("PANTALON", {"taille": "HAUTE", "fermeture": "BRAGUETTE_ZIP", "ceinture": "DROITE", "plis": "DEUX_PLIS",
                              "poches": "ITALIENNES", "poches_dos": "PASSEPOIL", "bas": "REVERS", "longueur": "MAXI"})
    assert p["details"] == {"taille": "HAUTE", "fermeture": "BRAGUETTE_ZIP", "ceinture": "DROITE", "plis": "DEUX_PLIS",
                            "poches": "ITALIENNES", "poches_dos": "PASSEPOIL", "bas": "REVERS", "longueur": "MAXI"}


def test_groups_are_dropped_where_they_mean_nothing() -> None:
    # A fly or a turn-up on a skirt, a vent on trousers, a waistband group on a dress.
    skirt = _profile("JUPE", {"fermeture": "BRAGUETTE_ZIP", "bas": "REVERS", "fente": "DOS", "taille": "POINTE"})
    assert skirt["details"] == {"fente": "DOS"}
    trousers = _profile("PANTALON", {"fente": "DOS", "fermeture": "CORDELIERE"})
    assert trousers["details"] == {}
    dress = _profile("ROBE", {"ceinture": "DROITE", "poches": "COUTURE", "fermeture": "ZIP_INVISIBLE"})
    assert dress["details"] == {"fermeture": "ZIP_INVISIBLE"}


def test_leg_fit_numbers_only_on_trousers() -> None:
    fit = {"fullness": {"leg": 1.4}, "lengths": {"legPct": 104}, "certainty": {"fullness.leg": "HIGH", "lengths.legPct": "MEDIUM"}}
    trousers = _profile("PANTALON", {}, fit)["fit"]
    assert trousers["fullness"] == {"leg": 1.4}
    assert trousers["lengths"] == {"legPct": 104}
    assert (_profile("JUPE", {}, fit).get("fit") or {}).get("fullness") is None
    # Out of bounds: clamped or dropped, never kept as is.
    wild = _profile("PANTALON", {}, {"fullness": {"leg": 9}, "certainty": {"fullness.leg": "HIGH"}})["fit"] or {}
    assert (wild.get("fullness") or {}).get("leg", 1.8) <= 1.8


def test_prompt_describes_the_new_groups() -> None:
    for group in ("ceinture", "plis", "poches", "poches_dos", "bas", "fente"):
        assert group in DETAIL_OPTIONS
    prompt = build_taxonomy_prompt()
    assert "fullness.leg" in prompt and "BRAGUETTE_ZIP" in prompt and "pattes d'éléphant" in prompt
