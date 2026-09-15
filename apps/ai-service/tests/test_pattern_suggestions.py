from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class MockGenerateContentResponse:
    def __init__(self, text):
        self.text = text


@patch("google.genai.Client")
def test_suggest_parameters_returns_suggestion(mock_client_class) -> None:
    mock_instance = mock_client_class.return_value
    mock_instance.models.generate_content.return_value = MockGenerateContentResponse(
        '{"suggestedCutType": "DROITE", "suggestedDetails": {}, '
        '"detectedInspirationFeatures": null, "confidence": 0.8, '
        '"modelVersion": "gemini-2.5-flash"}'
    )

    response = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE",
            "occasion": "MARIAGE",
            "style": "CLASSIQUE",
            "measurements": {"TOUR_TAILLE": 70},
            "inspirationImageUrl": None,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["confidence"] == 0.8
    assert body["modelVersion"] == "gemini-2.5-flash"
    assert body["detectedInspirationFeatures"] is None


@patch("google.genai.Client")
def test_suggest_parameters_corrects_unknown_cut_type(mock_client_class) -> None:
    mock_instance = mock_client_class.return_value
    mock_instance.models.generate_content.return_value = MockGenerateContentResponse(
        '{"suggestedCutType": "PAS_UNE_VRAIE_COUPE", "suggestedDetails": {}, '
        '"detectedInspirationFeatures": null, "confidence": 0.8, '
        '"modelVersion": "gemini-2.5-flash"}'
    )

    response = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE",
            "occasion": None,
            "style": None,
            "measurements": {},
            "inspirationImageUrl": None,
        },
    )

    assert response.status_code == 200
    assert response.json()["suggestedCutType"] == "DROITE"


@patch("google.genai.Client")
def test_chat_assistant_returns_response(mock_client_class) -> None:
    mock_instance = mock_client_class.return_value
    mock_instance.models.generate_content.return_value = MockGenerateContentResponse(
        "Oui, je peux vous aider."
    )

    response = client.post(
        "/v1/chat/assistant",
        json={
            "message": "Bonjour",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["response"] == "Oui, je peux vous aider."
