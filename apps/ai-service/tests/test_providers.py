from unittest.mock import MagicMock, patch
import pytest
from pydantic import BaseModel

from app.schemas import ProviderCredentials
from app.services.providers import clean_json_text, get_llm_provider
from app.services.providers.anthropic_provider import AnthropicProvider
from app.services.providers.gemini_provider import GeminiProvider
from app.services.providers.openai_compatible_provider import OpenAICompatibleProvider


class DummySchema(BaseModel):
    name: str
    count: int


def test_clean_json_text_removes_fences():
    raw1 = "```json\n{\"name\": \"Angaly\", \"count\": 42}\n```"
    assert clean_json_text(raw1) == '{"name": "Angaly", "count": 42}'

    raw2 = "```\n{\"name\": \"Test\", \"count\": 1}\n```"
    assert clean_json_text(raw2) == '{"name": "Test", "count": 1}'

    raw3 = '  {"name": "Direct", "count": 10}  '
    assert clean_json_text(raw3) == '{"name": "Direct", "count": 10}'


def test_provider_credentials_repr_masks_api_key():
    cred = ProviderCredentials(provider="ANTHROPIC", model="claude-3-5", apiKey="sk-ant-api0123456789")
    rep = repr(cred)
    assert "sk-ant-api" not in rep
    assert "••••6789" in rep
    assert "claude-3-5" in rep


def test_get_llm_provider_factory():
    p1 = get_llm_provider(ProviderCredentials(provider="ANTHROPIC", model="claude-sonnet-5-5", apiKey="sk-ant-test"))
    assert isinstance(p1, AnthropicProvider)
    assert p1.model == "claude-sonnet-5-5"

    p2 = get_llm_provider(ProviderCredentials(provider="GEMINI", model="gemini-2.5-flash", apiKey="gem-key"))
    assert isinstance(p2, GeminiProvider)
    assert p2.model == "gemini-2.5-flash"

    p3 = get_llm_provider(ProviderCredentials(provider="OPENAI", model="gpt-4o", apiKey="sk-oa-test"))
    assert isinstance(p3, OpenAICompatibleProvider)
    assert p3.provider_id == "OPENAI"

    p4 = get_llm_provider(ProviderCredentials(provider="MISTRAL", model="mistral-large-latest", apiKey="mis-key"))
    assert isinstance(p4, OpenAICompatibleProvider)
    assert p4.effective_base_url == "https://api.mistral.ai/v1"

    p5 = get_llm_provider(ProviderCredentials(provider="CUSTOM_OPENAI", model="llama3.2", baseUrl="http://localhost:11434/v1"))
    assert isinstance(p5, OpenAICompatibleProvider)
    assert p5.effective_base_url == "http://localhost:11434/v1"


@patch("google.genai.Client")
def test_gemini_provider_generate_json(mock_genai_client_class):
    mock_instance = mock_genai_client_class.return_value
    mock_response = MagicMock()
    mock_response.text = '{"name": "Robe Soirée", "count": 3}'
    mock_instance.models.generate_content.return_value = mock_response

    provider = GeminiProvider(model="gemini-2.5-flash", api_key="test-key")
    res = provider.generate_json("Prompt test", DummySchema)

    assert res.name == "Robe Soirée"
    assert res.count == 3


@patch("google.genai.Client")
def test_gemini_provider_test_connection_success(mock_genai_client_class):
    mock_instance = mock_genai_client_class.return_value
    mock_instance.models.generate_content.return_value = MagicMock()

    provider = GeminiProvider(model="gemini-2.5-flash", api_key="test-key")
    success, latency, msg = provider.test_connection()

    assert success is True
    assert latency >= 0
    assert "réussie" in msg


@patch("google.genai.Client")
def test_gemini_provider_test_connection_failure(mock_genai_client_class):
    mock_instance = mock_genai_client_class.return_value
    mock_instance.models.generate_content.side_effect = RuntimeError("API key quota exceeded")

    provider = GeminiProvider(model="gemini-2.5-flash", api_key="invalid-key")
    success, latency, msg = provider.test_connection()

    assert success is False
    assert "Échec" in msg


@patch("anthropic.Anthropic")
def test_anthropic_provider_generate_json(mock_anthropic_class):
    mock_instance = mock_anthropic_class.return_value
    mock_msg = MagicMock()
    mock_block = MagicMock()
    mock_block.text = '```json\n{"name": "Veste Tailleur", "count": 2}\n```'
    mock_msg.content = [mock_block]
    mock_instance.messages.create.return_value = mock_msg

    provider = AnthropicProvider(model="claude-sonnet-5-5", api_key="sk-ant-test")
    res = provider.generate_json("Prompt test", DummySchema)

    assert res.name == "Veste Tailleur"
    assert res.count == 2


@patch("anthropic.Anthropic")
def test_anthropic_provider_test_connection_success(mock_anthropic_class):
    mock_instance = mock_anthropic_class.return_value
    mock_instance.messages.create.return_value = MagicMock()

    provider = AnthropicProvider(model="claude-sonnet-5-5", api_key="sk-ant-test")
    success, latency, msg = provider.test_connection()

    assert success is True
    assert latency >= 0
    assert "réussie" in msg


@patch("anthropic.Anthropic")
def test_anthropic_provider_test_connection_failure(mock_anthropic_class):
    mock_instance = mock_anthropic_class.return_value
    mock_instance.messages.create.side_effect = ValueError("Invalid API Key")

    provider = AnthropicProvider(model="claude-sonnet-5-5", api_key="sk-ant-invalid")
    success, latency, msg = provider.test_connection()

    assert success is False
    assert "Échec" in msg


def test_anthropic_provider_requires_api_key():
    provider = AnthropicProvider(model="claude-sonnet-5-5", api_key=None)
    with pytest.raises(ValueError, match="clé API Anthropic"):
        provider._get_client()


@patch("openai.OpenAI")
def test_openai_compatible_provider_generate_json(mock_openai_class):
    mock_instance = mock_openai_class.return_value
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"name": "Pantalon Haute Couture", "count": 5}'
    mock_completion.choices = [mock_choice]
    mock_instance.chat.completions.create.return_value = mock_completion

    provider = OpenAICompatibleProvider(
        provider_id="GROQ",
        model="llama-3.3-70b-versatile",
        api_key="gsk-test",
    )
    res = provider.generate_json("Prompt test", DummySchema)

    assert res.name == "Pantalon Haute Couture"
    assert res.count == 5


@patch("openai.OpenAI")
def test_openai_compatible_provider_test_connection_success(mock_openai_class):
    mock_instance = mock_openai_class.return_value
    mock_instance.chat.completions.create.return_value = MagicMock()

    provider = OpenAICompatibleProvider(
        provider_id="MISTRAL",
        model="mistral-large-latest",
        api_key="mis-key",
    )
    success, latency, msg = provider.test_connection()

    assert success is True
    assert latency >= 0
    assert "Mistral AI" in msg


@patch("openai.OpenAI")
def test_openai_compatible_provider_test_connection_failure(mock_openai_class):
    mock_instance = mock_openai_class.return_value
    mock_instance.chat.completions.create.side_effect = RuntimeError("Service Unavailable")

    provider = OpenAICompatibleProvider(
        provider_id="OPENAI",
        model="gpt-4o",
        api_key="sk-oa-bad",
    )
    success, latency, msg = provider.test_connection()

    assert success is False
    assert "Échec" in msg
