"""Provider factory to resolve the appropriate LlmProvider implementation.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .anthropic_provider import AnthropicProvider
from .base import LlmProvider
from .gemini_provider import GeminiProvider
from .openai_compatible_provider import OpenAICompatibleProvider

if TYPE_CHECKING:
    from ...schemas import ProviderCredentials


def get_llm_provider(credentials: ProviderCredentials) -> LlmProvider:
    """Factory function that returns the corresponding LlmProvider instance
    based on the provided credentials.
    """
    provider_id = (credentials.provider or "").upper()

    if provider_id == "ANTHROPIC":
        return AnthropicProvider(model=credentials.model, api_key=credentials.api_key)
    elif provider_id == "GEMINI":
        return GeminiProvider(model=credentials.model, api_key=credentials.api_key)
    else:
        return OpenAICompatibleProvider(
            provider_id=provider_id,
            model=credentials.model,
            api_key=credentials.api_key,
            base_url=credentials.base_url,
        )
