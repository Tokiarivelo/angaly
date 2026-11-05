"""AI_LOCAL_MODELS_ENABLED: off by default, the self-hosted models are never offered nor loaded."""

import pytest
from fastapi.testclient import TestClient

from app import local_model, local_vision
from app.feature_flags import local_models_enabled
from app.main import app


@pytest.mark.parametrize(
    ("value", "expected"),
    [("", False), ("false", False), ("0", False), ("true", True), ("1", True), (" ON ", True)],
)
def test_switch_values(monkeypatch: pytest.MonkeyPatch, value: str, expected: bool) -> None:
    monkeypatch.setenv("AI_LOCAL_MODELS_ENABLED", value)
    assert local_models_enabled() is expected


def test_disabled_by_default_hides_local_models(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AI_LOCAL_MODELS_ENABLED", raising=False)
    assert local_model.is_local_model_available() is False
    assert local_model.is_local_model_available("FEMME") is False
    assert local_vision.available() is False

    client = TestClient(app)
    assert client.get("/v1/models").json()["measurementEstimation"] == ["GEMINI"]
    payload = {"provider": "LOCAL_STATISTICAL", "model": "ansur2-ridge-v1"}
    body = client.post("/v1/providers/test", json=payload).json()
    assert body["status"] == "INVALID"
