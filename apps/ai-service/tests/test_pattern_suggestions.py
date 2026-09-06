from fastapi.testclient import TestClient

from app.inference import PLACEHOLDER_MODEL_VERSION
from app.main import app

client = TestClient(app)


def test_suggest_parameters_returns_placeholder_with_zero_confidence() -> None:
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
    assert body["confidence"] == 0.0
    assert body["modelVersion"] == PLACEHOLDER_MODEL_VERSION
    assert body["detectedInspirationFeatures"] is None


def test_suggest_parameters_flags_inspiration_image_as_unanalyzed() -> None:
    response = client.post(
        "/v1/pattern/suggest-parameters",
        json={
            "garmentType": "ROBE_MARIEE",
            "measurements": {},
            "inspirationImageUrl": "http://localhost:9000/patterns/some-photo.jpg",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["detectedInspirationFeatures"] is not None
