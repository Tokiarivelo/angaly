"""Provider calls are bounded: a call that never answers must not freeze the service."""
from __future__ import annotations

import pytest

from app.services.providers.anthropic_provider import AnthropicProvider
from app.services.providers.base import provider_timeout_s


def test_default_and_env_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AI_PROVIDER_TIMEOUT_S", raising=False)
    assert provider_timeout_s() == 75.0
    monkeypatch.setenv("AI_PROVIDER_TIMEOUT_S", "30")
    assert provider_timeout_s() == 30.0
    for bad in ("abc", "0", "-5"):
        monkeypatch.setenv("AI_PROVIDER_TIMEOUT_S", bad)
        assert provider_timeout_s() == 75.0


def test_anthropic_client_is_bounded(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER_TIMEOUT_S", "42")
    client = AnthropicProvider(model="claude-opus-5-5", api_key="sk-test")._get_client()
    assert client.timeout == 42.0
    assert client.max_retries == 1
