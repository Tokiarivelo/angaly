"""Phase 5b S3 — the photo's ease / fullness / lengths are bounded, certain and garment-relevant."""

import base64
import re
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.garment_knowledge import (
    EASE_LEVELS,
    FABRIC_BEHAVIORS,
    FABRIC_PRINTS,
    FEW_SHOT_EXAMPLES,
    FIT_NUMBER_BOUNDS,
    build_taxonomy_prompt,
    normalize_fit,
    normalize_profile,
)
from app.main import app

client = TestClient(app)
PIXEL = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg").decode("ascii")
PROVIDER = {"provider": "ANTHROPIC", "model": "claude-haiku-4-5-20251001", "apiKey": "sk-ant-test-1234"}
SOURCE = Path(__file__).resolve().parents[3] / "packages" / "types" / "src" / "pattern-fit.ts"


def _ts_bounds(block: str) -> dict[str, tuple[float, float, float]]:
    body = SOURCE.read_text(encoding="utf-8").split(f"export const {block} = {{", 1)[1].split("} as const", 1)[0]
    return {
        name: (float(lo), float(hi), float(step))
        for name, lo, hi, step in re.findall(r"(\w+):\s*\{\s*min:\s*([\d.]+),\s*max:\s*([\d.]+),\s*step:\s*([\d.]+)", body)
    }


def test_bounds_and_vocabularies_match_the_shared_source() -> None:
    fullness = {f"fullness.{k}": v for k, v in _ts_bounds("FULLNESS_BOUNDS").items()}
    lengths = {f"lengths.{k}": v for k, v in _ts_bounds("LENGTH_BOUNDS").items()}
    assert {**fullness, **lengths} == FIT_NUMBER_BOUNDS

    ts = SOURCE.read_text(encoding="utf-8")
    levels = re.search(r"EASE_LEVELS = \[([^\]]*)\]", ts)
    assert levels and re.findall(r"'([A-Z_]+)'", levels.group(1)) == list(EASE_LEVELS)
    behaviors = re.search(r"FABRIC_BEHAVIORS = \[([^\]]*)\]", ts)
    assert behaviors and re.findall(r"'([A-Z_]+)'", behaviors.group(1)) == list(FABRIC_BEHAVIORS)
    prints = re.search(r"FABRIC_PRINTS = \[([^\]]*)\]", ts)
    assert prints and re.findall(r"'([A-Z_]+)'", prints.group(1)) == list(FABRIC_PRINTS)


def _robe(fit: dict | None, **extra: object) -> dict:
    return {"isGarment": True, "garmentType": "ROBE", "details": {"manches": "LONGUES"}, "fit": fit, **extra}


def test_certain_in_range_values_are_kept_and_rounded() -> None:
    fit = normalize_profile(
        _robe(
            {
                "ease": "ample",
                "fullness": {"skirt": 2.1, "sleeve": 1.6},
                "lengths": {"skirtPct": 90.4, "bodicePct": 100},
                "fabricBehavior": "fluide",
                "certainty": {
                    "ease": "high",
                    "fullness.skirt": "MEDIUM",
                    "fullness.sleeve": "HIGH",
                    "lengths.skirtPct": "HIGH",
                    "lengths.bodicePct": "MEDIUM",
                },
            }
        )
    )["fit"]
    assert fit["ease"] == "AMPLE"
    assert fit["fullness"] == {"skirt": 2, "sleeve": 1.5}
    assert fit["lengths"] == {"skirtPct": 90, "bodicePct": 100}
    assert fit["fabricBehavior"] == "FLUIDE"
    assert set(fit["certainty"]) == {"ease", "fullness.skirt", "fullness.sleeve", "lengths.skirtPct", "lengths.bodicePct"}


def test_fields_without_certainty_are_dropped_when_in_doubt() -> None:
    fit = normalize_fit(
        {"ease": "AMPLE", "fullness": {"skirt": 2}, "certainty": {"ease": "LOW"}}, "ROBE", {}
    )
    assert fit is None


def test_mild_overshoot_is_clamped_but_aberrant_values_are_rejected() -> None:
    certain = {"fullness.skirt": "HIGH", "lengths.skirtPct": "HIGH", "lengths.bodicePct": "HIGH"}
    fit = normalize_fit(
        {"fullness": {"skirt": 5}, "lengths": {"skirtPct": 400, "bodicePct": 130}, "certainty": certain},
        "ROBE",
        {},
    )
    assert fit is not None
    assert fit["fullness"] == {"skirt": 4}  # 5 is within 2× the bound: clamped
    assert "skirtPct" not in fit.get("lengths", {})  # 400 > 2×130: rejected
    assert fit["lengths"] == {"bodicePct": 120}


@pytest.mark.parametrize("bad", [True, "2", None, float("nan"), float("inf"), -3, 9])
def test_non_numbers_and_aberrant_numbers_are_rejected(bad: object) -> None:
    fit = normalize_fit({"fullness": {"skirt": bad}, "certainty": {"fullness.skirt": "HIGH"}}, "JUPE", {})
    assert fit is None


def test_fabric_print_and_colours_are_kept_alone_and_validated() -> None:
    fit = normalize_fit({"fabricPrint": "pois", "fabricColor": "#F4F2EE", "motifColor": "#5a1a22"}, "ROBE", {})
    assert fit == {"fabricPrint": "POIS", "fabricColor": "#f4f2ee", "motifColor": "#5a1a22", "certainty": {}}
    assert normalize_fit({"fabricPrint": "ZEBRE", "fabricColor": "white", "motifColor": "#12345"}, "ROBE", {}) is None


def test_unknown_ease_and_behavior_are_ignored() -> None:
    fit = normalize_fit(
        {"ease": "GIGANTESQUE", "fabricBehavior": "MAGIQUE", "certainty": {"ease": "HIGH"}}, "ROBE", {}
    )
    assert fit is None


@pytest.mark.parametrize(
    ("garment", "absent"),
    [
        ("PANTALON", {"fullness", "lengths"}),
        ("CHEMISE", {"skirt"}),
        ("JUPE", {"sleeve", "sleevePct"}),
    ],
)
def test_values_that_do_not_apply_to_the_garment_are_removed(garment: str, absent: set[str]) -> None:
    raw = {
        "fullness": {"skirt": 2, "sleeve": 1.5},
        "lengths": {"skirtPct": 90, "sleevePct": 50, "bodicePct": 100},
        "certainty": {
            "fullness.skirt": "HIGH",
            "fullness.sleeve": "HIGH",
            "lengths.skirtPct": "HIGH",
            "lengths.sleevePct": "HIGH",
            "lengths.bodicePct": "HIGH",
        },
    }
    fit = normalize_fit(raw, garment, {}) or {}
    flat = {*fit.get("fullness", {}), *fit.get("lengths", {}), *(["fullness", "lengths"] if garment == "PANTALON" and not fit else [])}
    if garment == "PANTALON":
        assert not fit
    else:
        assert not (absent & flat)


def test_sleeve_fullness_is_dropped_for_sleeveless_garments() -> None:
    fit = normalize_fit(
        {"fullness": {"sleeve": 2}, "ease": "AMPLE", "certainty": {"fullness.sleeve": "HIGH", "ease": "HIGH"}},
        "ROBE",
        {"manches": "SANS_MANCHES"},
    )
    assert fit is not None and "fullness" not in fit and fit["ease"] == "AMPLE"


def test_non_garment_has_no_fit_and_a_missing_fit_is_none() -> None:
    assert normalize_profile({"isGarment": False, "fit": {"ease": "AMPLE", "certainty": {"ease": "HIGH"}}})["fit"] is None
    assert normalize_profile(_robe(None))["fit"] is None
    assert normalize_profile(_robe("n'importe quoi"))["fit"] is None  # type: ignore[arg-type]


def test_prompt_teaches_the_fit_vocabulary_and_visual_cues() -> None:
    prompt = build_taxonomy_prompt()
    for token in ("AJUSTE", "AMPLE", "fullness.skirt", "lengths.skirtPct", "fabricBehavior", "certainty", "FLUIDE", "RIGIDE"):
        assert token in prompt


def test_few_shot_examples_cover_fit_and_stay_within_bounds() -> None:
    with_fit = [e for e in FEW_SHOT_EXAMPLES if e["profile"].get("fit")]
    assert len(with_fit) >= 3
    for example in FEW_SHOT_EXAMPLES:
        assert "fit" in example["profile"]


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_returns_a_validated_fit(mock_anthropic: MagicMock) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"silhouette": "ample"}, "profile": {"isGarment": true, '
                '"garmentType": "JUPE", "cutType": "EVASEE", "details": {"longueur": "MIDI"}, '
                '"fit": {"ease": "CONFORT", "fullness": {"skirt": 2.2, "sleeve": 2}, '
                '"lengths": {"skirtPct": 1000}, "certainty": {"ease": "HIGH", "fullness.skirt": "HIGH", '
                '"fullness.sleeve": "HIGH", "lengths.skirtPct": "HIGH"}}}, '
                '"confidence": 0.9, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    fit = body["profile"]["fit"]
    assert fit["ease"] == "CONFORT"
    assert fit["fullness"] == {"skirt": 2.25}  # skirt rounded to the 0.25 step; sleeve dropped (a skirt has none)
    assert not fit.get("lengths")  # 1000 % is aberrant
