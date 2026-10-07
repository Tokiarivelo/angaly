import os
from unittest.mock import patch
import pytest

from app.services.providers.ssrf import SsrfValidationError, validate_provider_base_url


def test_validate_base_url_allows_none_or_empty():
    validate_provider_base_url(None)
    validate_provider_base_url("")


def test_validate_base_url_allows_standard_https():
    validate_provider_base_url("https://api.openai.com/v1")
    validate_provider_base_url("https://api.groq.com/openai/v1")
    validate_provider_base_url("https://api.mistral.ai/v1")


def test_validate_base_url_allows_localhost_http():
    validate_provider_base_url("http://localhost:11434/v1")
    validate_provider_base_url("http://127.0.0.1:8000/v1")


def test_validate_base_url_blocks_metadata():
    with pytest.raises(SsrfValidationError, match="métadonnées"):
        validate_provider_base_url("http://169.254.169.254/latest/meta-data")

    with pytest.raises(SsrfValidationError, match="métadonnées"):
        validate_provider_base_url("http://metadata.google.internal/computeMetadata/v1")

    with pytest.raises(SsrfValidationError, match="métadonnées"):
        validate_provider_base_url("https://169.254.0.1/test")


@patch.dict(os.environ, {"NODE_ENV": "production"})
def test_validate_base_url_blocks_http_in_production():
    with pytest.raises(SsrfValidationError, match="HTTPS"):
        validate_provider_base_url("http://remote-server.com/v1")


@patch.dict(os.environ, {"NODE_ENV": "production"})
def test_validate_base_url_blocks_private_ips_in_production():
    with pytest.raises(SsrfValidationError, match="privés"):
        validate_provider_base_url("https://10.0.0.1/v1")

    with pytest.raises(SsrfValidationError, match="privés"):
        validate_provider_base_url("https://192.168.1.50/v1")

    with pytest.raises(SsrfValidationError, match="privés"):
        validate_provider_base_url("https://172.20.0.1/v1")


@patch.dict(os.environ, {"NODE_ENV": "production", "AI_ALLOWED_PRIVATE_HOSTS": "10.0.0.1,internal-ollama.corp"})
def test_validate_base_url_allows_whitelisted_private_hosts():
    validate_provider_base_url("https://10.0.0.1/v1")
    validate_provider_base_url("https://internal-ollama.corp/v1")
