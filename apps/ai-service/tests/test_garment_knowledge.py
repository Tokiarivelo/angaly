import base64
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.garment_knowledge import (
    CUT_TYPES,
    DETAIL_OPTIONS,
    FEW_SHOT_EXAMPLES,
    GARMENT_TYPES,
    build_taxonomy_prompt,
    normalize_profile,
)
from app.main import app

client = TestClient(app)
PIXEL = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg").decode("ascii")
PROVIDER = {"provider": "ANTHROPIC", "model": "claude-haiku-4-5-20251001", "apiKey": "sk-ant-test-1234"}


def test_prompt_lists_every_vocabulary_value() -> None:
    prompt = build_taxonomy_prompt()
    for key in [*GARMENT_TYPES, *CUT_TYPES]:
        assert key in prompt
    for options in DETAIL_OPTIONS.values():
        for key in options:
            assert key in prompt
    assert "isGarment=false" in prompt


def test_few_shot_examples_are_valid_against_the_taxonomy() -> None:
    for example in FEW_SHOT_EXAMPLES:
        profile = example["profile"]
        # Blocks carry a per-block `certainty` in the model's answer; normalisation consumes it.
        blocks = [{k: v for k, v in b.items() if k != "certainty"} for b in profile.get("drapeBlocks") or []]
        assert normalize_profile(profile) == {
            "drapeBlocks": None,
            **profile,
            "details": profile["details"],
            **({"drapeBlocks": blocks} if blocks else {}),
        }


def test_normalize_rejects_non_garment_and_clears_everything() -> None:
    result = normalize_profile({"isGarment": False, "garmentType": "ROBE", "cutType": "SIRENE"})
    assert result["isGarment"] is False
    assert result["garmentType"] is None and result["cutType"] is None


def test_normalize_drops_unknown_values_and_irrelevant_details() -> None:
    result = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "jupe",
            "style": "PUNK",
            "cutType": "evasee",
            "details": {"longueur": "midi", "manches": "LONGUES", "col": "NOPE"},
        }
    )
    assert result["garmentType"] == "JUPE"
    assert result["style"] is None
    assert result["cutType"] == "EVASEE"
    assert result["details"] == {"longueur": "MIDI"}  # a skirt has no sleeves


def test_normalize_unknown_garment_type_is_not_usable() -> None:
    assert normalize_profile({"isGarment": True, "garmentType": "CHAPEAU"})["isGarment"] is False


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_returns_validated_profile(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"silhouette": "sirène"}, "profile": {"isGarment": true, '
                '"garmentType": "ROBE_MARIEE", "occasion": "MARIAGE", "style": "GLAMOUR", '
                '"cutType": "SIRENE", "details": {"manches": "SANS_MANCHES", "col": "BIZARRE"}}, '
                '"confidence": 0.9, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["garmentType"] == "ROBE_MARIEE"
    assert body["profile"]["details"] == {"manches": "SANS_MANCHES"}
    assert body["suggestedCutType"] == "SIRENE"


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_non_garment_photo_prefills_nothing(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"tissu": "riz"}, "profile": {"isGarment": false}, '
                '"suggestedCutType": "DROITE", "confidence": 0.95, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["isGarment"] is False
    assert body["features"] == {}
    assert body["suggestedCutType"] is None


def test_normalize_keeps_construction_only_when_valid_and_notes_only_for_drapes() -> None:
    draped = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "ROBE",
            "constructionMethod": "draping",
            "presentation": "mannequin",
            "constructionNotes": "  Cascade sur l'épaule.  ",
        }
    )
    assert draped["constructionMethod"] == "DRAPING"
    assert draped["presentation"] == "MANNEQUIN"
    assert draped["constructionNotes"] == "Cascade sur l'épaule."

    flat = normalize_profile(
        {
            "isGarment": True,
            "garmentType": "JUPE",
            "constructionMethod": "FLAT_PATTERN",
            "constructionNotes": "ne doit pas rester",
        }
    )
    assert flat["constructionNotes"] is None

    bogus = normalize_profile({"isGarment": True, "garmentType": "JUPE", "constructionMethod": "MAGIE"})
    assert bogus["constructionMethod"] is None


def test_prompt_teaches_draping_vs_flat_pattern() -> None:
    prompt = build_taxonomy_prompt()
    for token in ("DRAPING", "FLAT_PATTERN", "MIXED", "MANNEQUIN", "WORN", "constructionNotes"):
        assert token in prompt


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_endpoint_returns_construction_method(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {}, "profile": {"isGarment": true, "garmentType": "ROBE", '
                '"constructionMethod": "DRAPING", "presentation": "MANNEQUIN", '
                '"constructionNotes": "Drapé en cascade."}, "confidence": 0.8, "modelVersion": "x"}'
            )
        ]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration", json={"imageBase64": PIXEL, "provider": PROVIDER}
    ).json()
    assert body["profile"]["constructionMethod"] == "DRAPING"
    assert body["profile"]["constructionNotes"] == "Drapé en cascade."
