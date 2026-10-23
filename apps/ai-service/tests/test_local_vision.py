"""Local photo model: used when the vision provider fails, validated like a provider's answer, optional."""
from __future__ import annotations

import base64
import io
from unittest.mock import patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import local_vision
from app.main import app

client = TestClient(app)
PROVIDER = {"provider": "ANTHROPIC", "model": "claude-opus-5-5", "apiKey": "sk-ant-test-1234"}


def _jpeg() -> str:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (64, 96), (200, 30, 40)).save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


class _Clf:
    """A fitted-looking classifier answering one class with a fixed probability."""

    def __init__(self, classes: list[str], winner: str, p: float) -> None:
        self.classes_ = np.array(classes)
        self._proba = np.array([[p if c == winner else (1 - p) / (len(classes) - 1) for c in classes]])

    def predict_proba(self, _x: np.ndarray) -> np.ndarray:
        return self._proba


class _Reg:
    def predict(self, _x: np.ndarray) -> np.ndarray:
        return np.array([2.3])


MODEL = {
    "version": "test",
    "fields": {
        "garmentType": _Clf(["ROBE", "PANTALON", "NON_VETEMENT"], "ROBE", 0.8),
        "cutType": _Clf(["EVASEE", "DROITE"], "EVASEE", 0.7),
        "details.longueur": _Clf(["MIDI", "SOL"], "MIDI", 0.9),
        # Below its threshold: the field stays empty rather than guessed.
        "details.manches": _Clf(["LONGUES", "COURTES"], "LONGUES", 0.55),
        "fit.ease": _Clf(["AJUSTE", "AMPLE"], "AMPLE", 0.9),
    },
    "regressors": {"fullness.skirt": _Reg()},
    "min_proba": {"garmentType": 0.4, "cutType": 0.5, "details.longueur": 0.5, "details.manches": 0.9, "fit.ease": 0.5},
}


@pytest.fixture
def local_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(local_vision, "available", lambda: True)
    monkeypatch.setattr(local_vision, "_profile_model", lambda: MODEL)
    monkeypatch.setattr(local_vision, "embed", lambda _b: np.zeros(1024, dtype=np.float32))


def test_predict_profile_keeps_only_sure_fields(local_model: None) -> None:
    profile, confidence = local_vision.predict_profile(base64.b64decode(_jpeg()))
    assert profile["garmentType"] == "ROBE" and profile["cutType"] == "EVASEE"
    assert profile["details"] == {"longueur": "MIDI"}
    assert profile["fit"]["fullness"] == {"skirt": 2.3} and profile["fit"]["ease"] == "AMPLE"
    assert profile["fit"]["fabricColor"].startswith("#")
    assert confidence == pytest.approx(0.8)


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_provider_failure_falls_back_to_the_local_model(mock_anthropic, local_model: None) -> None:
    mock_anthropic.return_value.messages.create.side_effect = RuntimeError("credit balance is too low")
    body = client.post("/v1/pattern/analyze-inspiration", json={"imageBase64": _jpeg(), "mimeType": "image/jpeg", "provider": PROVIDER}).json()
    assert body["modelVersion"] == "local-vision-test"
    assert body["profile"]["garmentType"] == "ROBE"
    assert body["profile"]["details"]["longueur"] == "MIDI"
    # Honest confidence: never above 0.6 for an approximate local reading.
    assert body["confidence"] <= 0.6


@patch("app.services.providers.anthropic_provider.anthropic.Anthropic")
def test_without_the_local_model_the_fallback_is_unchanged(mock_anthropic, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(local_vision, "available", lambda: False)
    mock_anthropic.return_value.messages.create.side_effect = RuntimeError("down")
    body = client.post("/v1/pattern/analyze-inspiration", json={"imageBase64": _jpeg(), "mimeType": "image/jpeg", "provider": PROVIDER}).json()
    assert body["modelVersion"] == "fallback-0.0.0"
    assert body["profile"] is None


def test_non_garment_is_not_prefilled(local_model: None, monkeypatch: pytest.MonkeyPatch) -> None:
    model = {**MODEL, "fields": {**MODEL["fields"], "garmentType": _Clf(["ROBE", "NON_VETEMENT"], "NON_VETEMENT", 0.9)}}
    monkeypatch.setattr(local_vision, "_profile_model", lambda: model)
    profile, _ = local_vision.predict_profile(base64.b64decode(_jpeg()))
    assert profile == {"isGarment": False}
