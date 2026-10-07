import base64
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

PIXEL = base64.b64encode(b"\xff\xd8\xff\xe0fake-jpeg").decode("ascii")
PROVIDER = {"provider": "ANTHROPIC", "model": "claude-haiku-4-5-20251001", "apiKey": "sk-ant-test-1234"}


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_analyze_inspiration_sends_one_image_block_and_returns_features(mock_anthropic) -> None:
    create = mock_anthropic.return_value.messages.create
    create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"features": {"neckline": "col bateau", "sleeves": "longues"}, '
                '"suggestedCutType": "EVASEE", "confidence": 0.82, "modelVersion": "x"}'
            )
        ]
    )

    response = client.post(
        "/v1/pattern/analyze-inspiration",
        json={"imageBase64": PIXEL, "mimeType": "image/jpeg", "provider": PROVIDER},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["features"]["neckline"] == "col bateau"
    assert body["suggestedCutType"] == "EVASEE"
    assert body["modelVersion"] == "claude-haiku-4-5-20251001"

    kwargs = create.call_args.kwargs
    assert kwargs["max_tokens"] == 512
    blocks = kwargs["messages"][0]["content"]
    assert [b["type"] for b in blocks] == ["image", "text"]
    assert blocks[0]["source"]["media_type"] == "image/jpeg"


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_analyze_inspiration_drops_unknown_cut_type(mock_anthropic) -> None:
    mock_anthropic.return_value.messages.create.return_value = MagicMock(
        content=[MagicMock(text='{"features": {}, "suggestedCutType": "BIZARRE", "confidence": 0.5, "modelVersion": "x"}')]
    )
    body = client.post(
        "/v1/pattern/analyze-inspiration",
        json={"imageBase64": PIXEL, "provider": PROVIDER},
    ).json()
    assert body["suggestedCutType"] is None


def test_analyze_inspiration_falls_back_on_invalid_base64() -> None:
    body = client.post(
        "/v1/pattern/analyze-inspiration",
        json={"imageBase64": "%%%not-base64%%%", "provider": PROVIDER},
    ).json()
    assert body["modelVersion"] == "fallback-0.0.0"
    assert body["confidence"] == 0.0
    assert body["features"] == {}


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_suggest_parameters_uses_features_instead_of_image(mock_anthropic) -> None:
    create = mock_anthropic.return_value.messages.create
    create.return_value = MagicMock(
        content=[MagicMock(text='{"suggestedCutType": "DROITE", "suggestedDetails": {}, "confidence": 0.7, "modelVersion": "x"}')]
    )
    body = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE",
            "measurements": {},
            "inspirationFeatures": {"neckline": "col bateau"},
            "provider": PROVIDER,
        },
    ).json()
    prompt = create.call_args.kwargs["messages"][0]["content"]
    assert "col bateau" in prompt
    assert body["detectedInspirationFeatures"] == {"neckline": "col bateau"}
