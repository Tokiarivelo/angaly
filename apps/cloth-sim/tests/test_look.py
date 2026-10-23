from __future__ import annotations

import pytest

from cloth_sim.look import (
    EMBROIDERY_COLOR,
    PRINT_TILE_M,
    accent_material,
    panel_material,
    print_tile_m,
    srgb_to_linear,
)

COAT = {
    "fabricColor": "#0E1534",
    "fabricPrint": "UNI",
    "fabricFinish": "VELOURS",
    "motifColor": "#D2AE5C",
    "accentPrint": "ARABESQUE",
    "contrastColor": "#EADCB8",
    "contrastPrint": "BROCART",
    "contrastMotifColor": "#B98A3E",
}


def test_the_dress_panels_take_the_main_fabric() -> None:
    m = panel_material("skirt", COAT)
    assert (m.key, m.color, m.print, m.finish) == ("dress", "#0e1534", "UNI", "VELOURS")


def test_the_plastron_takes_the_contrast_fabric_as_a_silk() -> None:
    m = panel_material("plastron", COAT)
    assert (m.key, m.color, m.print, m.motif, m.finish) == ("contrast", "#eadcb8", "BROCART", "#b98a3e", "SATIN")
    assert m.tile_m == pytest.approx(0.09)


def test_a_plastron_without_a_contrast_colour_is_in_the_dress_fabric() -> None:
    assert panel_material("plastron", {"fabricColor": "#112233"}).key == "dress"


def test_the_accent_is_the_dress_colour_with_the_accent_print() -> None:
    a = accent_material(COAT)
    assert a is not None and (a.color, a.print, a.motif) == ("#0e1534", "ARABESQUE", "#d2ae5c")
    assert a.tile_m == pytest.approx(0.14)
    assert accent_material({"fabricColor": "#112233"}) is None
    assert accent_material({"accentPrint": "UNI"}) is None


def test_defaults_for_a_missing_or_invalid_look() -> None:
    m = panel_material("bodice", {"fabricColor": "navy", "fabricPrint": "PAILLETTES", "fabricFinish": "CUIR"})
    assert (m.print, m.finish) == ("UNI", "MAT")
    assert m.color.startswith("#") and len(m.color) == 7


def test_print_tile_follows_the_motif_size() -> None:
    assert print_tile_m("POIS") == PRINT_TILE_M
    assert print_tile_m("FLEURI", 14) == pytest.approx(0.14 / 0.36)
    assert print_tile_m("FLEURI", 500) == pytest.approx(0.6 / 0.36)
    assert print_tile_m("POIS", True) == PRINT_TILE_M
    assert panel_material("skirt", {"fabricPrint": "FLEURI", "motifSizeCm": 14}).tile_m == pytest.approx(0.14 / 0.36)


def test_srgb_to_linear() -> None:
    assert srgb_to_linear("#000000") == (0.0, 0.0, 0.0)
    assert srgb_to_linear("#ffffff") == pytest.approx((1.0, 1.0, 1.0))
    assert srgb_to_linear("#808080")[0] == pytest.approx(0.2158, abs=1e-3)


def test_an_embroidery_is_the_fabric_with_its_thread_over_it() -> None:
    spec = panel_material("detail", COAT, "BRODERIE", "#c0392b")
    assert (spec.detail, spec.thread) == ("BRODERIE", "#c0392b")
    # Same ground as the dress (the cloth shows between the motifs), its own material.
    dress = panel_material("bodice", COAT)
    assert (spec.color, spec.print, spec.finish) == (dress.color, dress.print, dress.finish)
    assert spec.key != dress.key


def test_an_embroidery_without_thread_colour_takes_the_contrast_colour_then_gold() -> None:
    assert panel_material("detail", COAT, "BRODERIE").thread == "#eadcb8"
    assert panel_material("detail", {"fabricColor": "#f1ede4"}, "BRODERIE", "nope").thread == EMBROIDERY_COLOR


def test_smocking_is_the_dress_fabric_with_its_relief_and_plain_panels_have_no_motif() -> None:
    smocks = panel_material("detail", COAT, "SMOCKS", "#c0392b")
    assert (smocks.detail, smocks.thread, smocks.color) == ("SMOCKS", "", "#0e1534")
    assert panel_material("detail", COAT).detail == ""
    assert panel_material("detail", COAT, "PAILLETTES").detail == ""
