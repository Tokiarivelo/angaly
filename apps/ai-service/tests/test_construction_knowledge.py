"""Visible construction pieces read off a photo: validation, and agreement with @angaly/types."""
import re
from pathlib import Path

from app.construction_knowledge import BOUNDS, CONSTRUCTION_GUIDE, FIELDS, VISIBLE_KINDS, normalize_construction
from app.garment_knowledge import build_taxonomy_prompt, normalize_profile

TYPES = Path(__file__).resolve().parents[3] / "packages" / "types" / "src" / "pattern-construction.ts"


def test_keeps_certain_in_range_items_and_drops_the_rest():
    raw = [
        {"kind": "HEM_FLOUNCE", "tiers": 3, "depthMm": 200, "style": "fronce", "certainty": "HIGH"},
        {"kind": "GODETS", "count": 6, "heightMm": 380, "widthMm": 300, "certainty": "LOW"},
        {"kind": "BOW", "place": "DOS", "widthMm": 1000, "certainty": "HIGH", "color": "#AA2233", "material": "TISSU"},
        {"kind": "BOW", "place": "DOS", "widthMm": 200, "certainty": "HIGH"},
        {"kind": "LINING", "certainty": "HIGH"},
        {"kind": "SMOCKING", "place": "CORSAGE", "rows": 8, "ratio": 3, "certainty": "MEDIUM"},
        {"kind": "PEPLUM", "style": "ZIGZAG", "depthMm": 150, "certainty": "HIGH"},
    ]
    out = normalize_construction(raw, "ROBE")
    assert out == [
        {"kind": "HEM_FLOUNCE", "tiers": 3, "depthMm": 200, "style": "FRONCE"},
        {"kind": "BOW", "place": "DOS", "widthMm": 600, "material": "TISSU", "color": "#aa2233"},
        {"kind": "SMOCKING", "place": "CORSAGE", "rows": 8, "ratio": 3},
    ]


def test_only_dresses_and_nothing_valid_is_none():
    assert normalize_construction([{"kind": "JABOT", "lengthMm": 200, "tiers": 1, "certainty": "HIGH"}], "PANTALON") is None
    assert normalize_construction([], "ROBE") is None
    assert normalize_construction("x", "ROBE") is None


def test_profile_carries_construction_only_when_seen():
    base = {"isGarment": True, "garmentType": "ROBE", "details": {}}
    assert "construction" not in normalize_profile(base)
    seen = normalize_profile({**base, "construction": [{"kind": "CAPELET", "lengthMm": 250, "certainty": "HIGH"}]})
    assert seen["construction"] == [{"kind": "CAPELET", "lengthMm": 250}]


def test_prompt_explains_construction():
    assert CONSTRUCTION_GUIDE in build_taxonomy_prompt()


def test_bounds_and_kinds_agree_with_shared_types():
    ts = TYPES.read_text()
    for kind in VISIBLE_KINDS:
        assert f"'{kind}'" in ts, kind
    for key, (low, high) in BOUNDS.items():
        m = re.search(rf"{key}: \{{ min: ([\d.]+), max: ([\d.]+) \}}", ts)
        assert m, key
        assert (float(m.group(1)), float(m.group(2))) == (low, high), key
    assert set(FIELDS) == set(VISIBLE_KINDS)
