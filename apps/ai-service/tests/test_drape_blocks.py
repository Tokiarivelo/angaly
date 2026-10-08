"""Phase 5b S5 — the photo may name deterministic drape blocks; only certain, in-range, relevant ones survive."""

import re
from pathlib import Path

import pytest

from app.garment_knowledge import (
    CIRCLE_FRACTIONS,
    DRAPE_BLOCK_KINDS,
    DRAPE_BLOCKS_BY_GARMENT,
    DRAPE_BOUNDS,
    MAX_DRAPE_BLOCKS,
    FEW_SHOT_EXAMPLES,
    build_taxonomy_prompt,
    normalize_drape_blocks,
    normalize_profile,
)

SOURCE = Path(__file__).resolve().parents[3] / "packages" / "types" / "src" / "pattern-fit.ts"


def _ts() -> str:
    return SOURCE.read_text(encoding="utf-8")


def test_kinds_bounds_and_applicability_match_the_shared_source() -> None:
    ts = _ts()
    kinds = re.search(r"DRAPE_BLOCK_KINDS = \[([^\]]*)\]", ts)
    assert kinds and re.findall(r"'([A-Z_]+)'", kinds.group(1)) == list(DRAPE_BLOCK_KINDS)

    body = ts.split("export const DRAPE_BOUNDS = {", 1)[1].split("} as const", 1)[0]
    shared = {
        name: (float(lo), float(hi), float(step))
        for name, lo, hi, step in re.findall(r"(\w+):\s*\{\s*min:\s*([\d.]+),\s*max:\s*([\d.]+),\s*step:\s*([\d.]+)", body)
    }
    assert shared == DRAPE_BOUNDS

    assert re.search(r"CIRCLE_FRACTIONS = \[0\.25, 0\.5, 1\]", ts) and CIRCLE_FRACTIONS == (0.25, 0.5, 1)
    assert re.search(rf"MAX_DRAPE_BLOCKS = {MAX_DRAPE_BLOCKS};", ts)

    by_garment = ts.split("DRAPE_BLOCKS_BY_GARMENT:", 1)[1].split("};", 1)[0]
    assert "JUPE" in by_garment and "ROBE_MARIEE: DRAPE_BLOCK_KINDS" in by_garment
    jupe = re.search(r"JUPE: \[([^\]]*)\]", by_garment)
    assert jupe and set(re.findall(r"'([A-Z_]+)'", jupe.group(1))) == DRAPE_BLOCKS_BY_GARMENT["JUPE"]
    assert DRAPE_BLOCKS_BY_GARMENT["ROBE"] == set(DRAPE_BLOCK_KINDS)


def _norm(blocks: object, garment: str = "ROBE", construction: str | None = "FLAT_PATTERN"):
    return normalize_drape_blocks(blocks, garment, construction)


def test_certain_in_range_blocks_are_kept_rounded_and_stripped_of_certainty() -> None:
    blocks = _norm(
        [
            {"kind": "gathered_skirt", "fullness": 2.1, "certainty": "high"},
            {"kind": "WRAP_FRONT", "overlapMm": 99.6, "side": "left", "certainty": "MEDIUM"},
            {"kind": "TRAIN", "lengthMm": 903, "certainty": "HIGH"},
            {"kind": "COWL_NECK", "depthMm": 150, "certainty": "HIGH"},
            {"kind": "OVERSKIRT", "lengthPct": 80, "side": "RIGHT", "certainty": "HIGH"},
            {"kind": "DRAPED_BODICE", "pleats": 6, "side": "LEFT", "certainty": "HIGH"},
        ]
    )
    assert blocks == [
        {"kind": "GATHERED_SKIRT", "fullness": 2},
        {"kind": "WRAP_FRONT", "overlapMm": 100, "side": "LEFT"},
        {"kind": "TRAIN", "lengthMm": 900},
        {"kind": "COWL_NECK", "depthMm": 150},
        {"kind": "OVERSKIRT", "lengthPct": 80, "side": "RIGHT"},
        {"kind": "DRAPED_BODICE", "pleats": 6, "side": "LEFT"},
    ]


def test_pleated_and_circle_and_hem_blocks() -> None:
    blocks = _norm(
        [
            {"kind": "PLEATED_SKIRT", "pleats": 24, "depthMm": 25, "type": "box", "certainty": "HIGH"},
            {"kind": "ASYMMETRIC_HEM", "dropMm": 255, "side": "RIGHT", "certainty": "HIGH"},
        ]
    )
    assert blocks == [
        {"kind": "PLEATED_SKIRT", "pleats": 24, "depthMm": 25, "type": "BOX"},
        {"kind": "ASYMMETRIC_HEM", "dropMm": 260, "side": "RIGHT"},
    ]
    assert _norm([{"kind": "CIRCLE_SKIRT", "fraction": 0.5, "certainty": "HIGH"}]) == [
        {"kind": "CIRCLE_SKIRT", "fraction": 0.5}
    ]


@pytest.mark.parametrize(
    "bad",
    [
        {"kind": "GATHERED_SKIRT", "fullness": 2},  # no certainty
        {"kind": "GATHERED_SKIRT", "fullness": 2, "certainty": "LOW"},
        {"kind": "GATHERED_SKIRT", "fullness": 99, "certainty": "HIGH"},  # aberrant
        {"kind": "GATHERED_SKIRT", "fullness": "2", "certainty": "HIGH"},
        {"kind": "GATHERED_SKIRT", "fullness": True, "certainty": "HIGH"},
        {"kind": "GATHERED_SKIRT", "certainty": "HIGH"},  # missing parameter
        {"kind": "CIRCLE_SKIRT", "fraction": 0.3, "certainty": "HIGH"},
        {"kind": "PLEATED_SKIRT", "pleats": 24, "depthMm": 25, "type": "ACCORDION", "certainty": "HIGH"},
        {"kind": "WRAP_FRONT", "overlapMm": 100, "side": "UP", "certainty": "HIGH"},
        {"kind": "HOVERCRAFT", "certainty": "HIGH"},
        "GATHERED_SKIRT",
        None,
    ],
)
def test_doubtful_or_invalid_blocks_are_dropped(bad: object) -> None:
    assert _norm([bad]) is None


def test_mild_overshoot_is_clamped() -> None:
    assert _norm([{"kind": "GATHERED_SKIRT", "fullness": 5, "certainty": "HIGH"}]) == [
        {"kind": "GATHERED_SKIRT", "fullness": 4}
    ]


def test_one_skirt_block_one_per_kind_and_a_cap() -> None:
    blocks = _norm(
        [
            {"kind": "GATHERED_SKIRT", "fullness": 2, "certainty": "HIGH"},
            {"kind": "CIRCLE_SKIRT", "fraction": 1, "certainty": "HIGH"},
            {"kind": "TRAIN", "lengthMm": 500, "certainty": "HIGH"},
            {"kind": "TRAIN", "lengthMm": 900, "certainty": "HIGH"},
        ]
    )
    assert blocks == [{"kind": "GATHERED_SKIRT", "fullness": 2}, {"kind": "TRAIN", "lengthMm": 500}]
    many = [
        {"kind": k, **p, "certainty": "HIGH"}
        for k, p in [
            ("GATHERED_SKIRT", {"fullness": 2}),
            ("WRAP_FRONT", {"overlapMm": 100, "side": "LEFT"}),
            ("COWL_NECK", {"depthMm": 100}),
            ("TRAIN", {"lengthMm": 500}),
            ("OVERSKIRT", {"lengthPct": 70, "side": "LEFT"}),
            ("DRAPED_BODICE", {"pleats": 5, "side": "LEFT"}),
            ("ASYMMETRIC_HEM", {"dropMm": 200, "side": "LEFT"}),
        ]
    ]
    assert len(_norm(many) or []) == MAX_DRAPE_BLOCKS


def test_blocks_only_for_garments_that_support_them() -> None:
    skirt = [{"kind": "GATHERED_SKIRT", "fullness": 2, "certainty": "HIGH"}]
    cowl = [{"kind": "COWL_NECK", "depthMm": 100, "certainty": "HIGH"}]
    assert _norm(skirt, "JUPE") is not None
    assert _norm(skirt, "PANTALON") is None
    assert _norm(skirt, "CHEMISE") is None
    assert _norm(cowl, "JUPE") is None  # a skirt has no neckline
    assert _norm(cowl, "ROBE_MARIEE") is not None


def test_a_free_drape_never_gets_blocks() -> None:
    skirt = [{"kind": "GATHERED_SKIRT", "fullness": 2, "certainty": "HIGH"}]
    assert _norm(skirt, "ROBE", "DRAPING") is None
    assert _norm(skirt, "ROBE", "MIXED") is not None  # fitted base + regular drape + mannequin part
    assert _norm(skirt, "ROBE", None) is not None


def test_not_a_list_is_nothing() -> None:
    assert _norm("TRAIN") is None
    assert _norm({"kind": "TRAIN"}) is None
    assert _norm(None) is None
    assert _norm([]) is None


def test_profile_carries_blocks_and_clears_them_for_non_garments_and_draping() -> None:
    profile = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "ROBE_MARIEE",
            "constructionMethod": "MIXED",
            "constructionNotes": "Traîne à draper.",
            "drapeBlocks": [{"kind": "TRAIN", "lengthMm": 900, "certainty": "HIGH"}],
        }
    )
    assert profile["drapeBlocks"] == [{"kind": "TRAIN", "lengthMm": 900}]
    assert profile["constructionNotes"] == "Traîne à draper."

    draped = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "ROBE",
            "constructionMethod": "DRAPING",
            "drapeBlocks": [{"kind": "GATHERED_SKIRT", "fullness": 2, "certainty": "HIGH"}],
        }
    )
    assert draped["drapeBlocks"] is None
    assert normalize_profile({"isGarment": False, "drapeBlocks": []})["drapeBlocks"] is None


def test_prompt_and_examples_teach_the_blocks() -> None:
    prompt = build_taxonomy_prompt()
    for kind in DRAPE_BLOCK_KINDS:
        assert kind in prompt
    for token in ("drapeBlocks", "Drapé libre", "jamais un moulage", "certainty"):
        assert token in prompt or token.lower() in prompt.lower()
    with_blocks = [e for e in FEW_SHOT_EXAMPLES if e["profile"].get("drapeBlocks")]
    assert len(with_blocks) >= 2
    for example in with_blocks:
        assert normalize_profile(example["profile"])["drapeBlocks"], example["scene"]
