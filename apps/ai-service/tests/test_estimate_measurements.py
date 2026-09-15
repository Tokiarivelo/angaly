from unittest.mock import patch

from fastapi.testclient import TestClient

from app import local_model
from app.main import app

client = TestClient(app)


class MockGenerateContentResponse:
    def __init__(self, text):
        self.text = text


@patch("google.genai.Client")
def test_estimate_measurements_returns_only_requested_keys(mock_client_class) -> None:
    mock_instance = mock_client_class.return_value
    mock_instance.models.generate_content.return_value = MockGenerateContentResponse(
        '{"estimatedMeasurements": {"TOUR_BASSIN": 95, "TOUR_COU": 99}, '
        '"estimatedKeys": ["TOUR_BASSIN", "TOUR_COU"], "confidence": 0.3, '
        '"modelVersion": "gemini-2.5-flash"}'
    )

    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 70},
            "requiredKeys": ["TOUR_BASSIN"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    # TOUR_COU was not asked for — must be filtered out even if the LLM returned it.
    assert body["estimatedMeasurements"] == {"TOUR_BASSIN": 95}
    assert body["estimatedKeys"] == ["TOUR_BASSIN"]
    assert body["confidence"] == 0.3


def test_estimate_measurements_returns_noop_when_nothing_is_missing() -> None:
    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_BASSIN": 95},
            "requiredKeys": ["TOUR_BASSIN"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["estimatedMeasurements"] == {}
    assert body["estimatedKeys"] == []


@patch("google.genai.Client")
def test_estimate_measurements_falls_back_to_nearest_size_chart_entry_on_error(
    mock_client_class,
) -> None:
    mock_client_class.side_effect = Exception("Gemini unreachable")

    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 70},
            "requiredKeys": ["TOUR_BASSIN"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["modelVersion"] == "fallback-size-chart-0.0.0"
    assert "TOUR_BASSIN" in body["estimatedMeasurements"]
    # Never raises — always degrades gracefully (spec: no blocking exception).
    assert body["confidence"] < 0.5


def test_estimate_measurements_uses_local_model_when_requested_and_available() -> None:
    if not local_model.is_local_model_available("FEMME"):
        return  # artifacts are gitignored — skip if this environment never ran the training script

    response = client.post(
        "/v1/pattern/estimate-measurements",
        json={
            "garmentType": "ROBE",
            "gender": "FEMME",
            "knownMeasurements": {"TOUR_POITRINE": 88, "TOUR_TAILLE": 70},
            "requiredKeys": ["TOUR_BASSIN"],
            "modelPreference": "LOCAL_STATISTICAL",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["modelVersion"] == local_model.LOCAL_MODEL_VERSION
    assert "TOUR_BASSIN" in body["estimatedMeasurements"]


def test_estimate_measurements_local_preference_falls_back_to_gemini_without_artifacts() -> None:
    original = dict(local_model._artifacts)
    try:
        local_model._artifacts.clear()
        local_model._load_attempted = True

        with patch("google.genai.Client") as mock_client_class:
            mock_instance = mock_client_class.return_value
            mock_instance.models.generate_content.return_value = MockGenerateContentResponse(
                '{"estimatedMeasurements": {"TOUR_BASSIN": 96}, '
                '"estimatedKeys": ["TOUR_BASSIN"], "confidence": 0.3, '
                '"modelVersion": "gemini-2.5-flash"}'
            )
            response = client.post(
                "/v1/pattern/estimate-measurements",
                json={
                    "garmentType": "ROBE",
                    "gender": "FEMME",
                    "knownMeasurements": {"TOUR_POITRINE": 88},
                    "requiredKeys": ["TOUR_BASSIN"],
                    "modelPreference": "LOCAL_STATISTICAL",
                },
            )
    finally:
        local_model._artifacts.clear()
        local_model._artifacts.update(original)

    assert response.status_code == 200
    assert response.json()["modelVersion"] == "gemini-2.5-flash"


def test_available_models_endpoint_lists_local_statistical_when_loaded() -> None:
    response = client.get("/v1/models")

    assert response.status_code == 200
    body = response.json()
    assert "GEMINI" in body["measurementEstimation"]
    if local_model.is_local_model_available():
        assert "LOCAL_STATISTICAL" in body["measurementEstimation"]
