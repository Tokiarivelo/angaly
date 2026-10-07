from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import PatternAiSuggestionResponse, PatternMeasurementEstimationResponse

client = TestClient(app)


@patch("app.inference.get_llm_provider")
def test_suggest_parameters_with_custom_provider(mock_get_llm_provider):
    mock_provider = MagicMock()
    mock_provider.generate_json.return_value = PatternAiSuggestionResponse(
        suggestedCutType="EVASEE",
        suggestedDetails={"manches": "ballon", "col": "bateau"},
        detectedInspirationFeatures=None,
        confidence=0.92,
        modelVersion="placeholder",
    )
    mock_get_llm_provider.return_value = mock_provider

    response = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE",
            "occasion": "GALA",
            "style": "COUTURE",
            "measurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 68},
            "inspirationImageUrl": None,
            "provider": {
                "provider": "ANTHROPIC",
                "model": "claude-sonnet-5-5",
                "apiKey": "sk-ant-test",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["suggestedCutType"] == "EVASEE"
    assert body["suggestedDetails"]["col"] == "bateau"
    assert body["modelVersion"] == "claude-sonnet-5-5"
    assert body["confidence"] == 0.92


@patch("app.inference.get_llm_provider")
def test_suggest_parameters_fallback_on_provider_error(mock_get_llm_provider):
    mock_provider = MagicMock()
    mock_provider.generate_json.side_effect = RuntimeError("Anthropic rate limited")
    mock_get_llm_provider.return_value = mock_provider

    response = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE",
            "provider": {
                "provider": "ANTHROPIC",
                "model": "claude-sonnet-5-5",
                "apiKey": "sk-ant-test",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["suggestedCutType"] == "DROITE"
    assert body["modelVersion"] == "fallback-0.0.0"
    assert body["confidence"] == 0.1


@patch("app.inference.get_llm_provider")
def test_estimate_measurements_with_custom_provider(mock_get_llm_provider):
    mock_provider = MagicMock()
    mock_provider.generate_json.return_value = PatternMeasurementEstimationResponse(
        estimatedMeasurements={"TOUR_BASSIN": 94.0, "LONGUEUR_DOS": 40.5},
        estimatedKeys=["TOUR_BASSIN", "LONGUEUR_DOS"],
        confidence=0.45,
        modelVersion="placeholder",
    )
    mock_get_llm_provider.return_value = mock_provider

    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 68},
            "requiredKeys": ["TOUR_POITRINE", "TOUR_TAILLE", "TOUR_BASSIN", "LONGUEUR_DOS"],
            "provider": {
                "provider": "OPENAI",
                "model": "gpt-4o",
                "apiKey": "sk-oa-test",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["estimatedMeasurements"]["TOUR_BASSIN"] == 94.0
    assert body["modelVersion"] == "gpt-4o"
    assert body["confidence"] == 0.45


def test_estimate_measurements_with_local_statistical_provider():
    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 68},
            "requiredKeys": ["TOUR_BASSIN"],
            "provider": {
                "provider": "LOCAL_STATISTICAL",
                "model": "ansur2-ridge-v1",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert "TOUR_BASSIN" in body["estimatedMeasurements"]
    assert "ansur2" in body["modelVersion"]
