from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_provider_test_local_statistical():
    response = client.post(
        "/v1/providers/test",
        json={
            "provider": "LOCAL_STATISTICAL",
            "model": "ansur2-ridge-v1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "OK"
    assert body["provider"] == "LOCAL_STATISTICAL"
    assert "opérationnel" in body["message"]


@patch("app.main.get_llm_provider")
def test_provider_test_success(mock_get_llm_provider):
    mock_provider = MagicMock()
    mock_provider.test_connection.return_value = (True, 42, "Connexion réussie")
    mock_get_llm_provider.return_value = mock_provider

    response = client.post(
        "/v1/providers/test",
        json={
            "provider": "ANTHROPIC",
            "model": "claude-sonnet-5-5",
            "apiKey": "sk-ant-valid",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "OK"
    assert body["latencyMs"] == 42
    assert body["message"] == "Connexion réussie"


@patch("app.main.get_llm_provider")
def test_provider_test_failure(mock_get_llm_provider):
    mock_provider = MagicMock()
    mock_provider.test_connection.return_value = (False, 120, "Clé API révoquée")
    mock_get_llm_provider.return_value = mock_provider

    response = client.post(
        "/v1/providers/test",
        json={
            "provider": "OPENAI",
            "model": "gpt-4o",
            "apiKey": "sk-bad",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "INVALID"
    assert body["latencyMs"] == 120
    assert "révoquée" in body["message"]


def test_provider_test_ssrf_blocked():
    response = client.post(
        "/v1/providers/test",
        json={
            "provider": "CUSTOM_OPENAI",
            "model": "llama3.2",
            "baseUrl": "http://169.254.169.254/v1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "INVALID"
    assert "SSRF" in body["message"]
