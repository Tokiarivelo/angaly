"""Generic OpenAI-compatible LLM provider adapter using the openai SDK.
Supports OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Meta Muse, and Custom/Ollama.
Specified in docs/features/ai-providers.md §2 & §6.
"""

from __future__ import annotations

import json
import logging
import time
from typing import TypeVar

import openai
from pydantic import BaseModel

from .base import LlmProvider, clean_json_text
from .ssrf import validate_provider_base_url

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("angaly.ai_service.openai_compatible")

DEFAULT_BASE_URLS: dict[str, str] = {
    "MISTRAL": "https://api.mistral.ai/v1",
    "GROQ": "https://api.groq.com/openai/v1",
    "OPENROUTER": "https://openrouter.ai/api/v1",
    "DEEPSEEK": "https://api.deepseek.com/v1",
    "TOGETHER": "https://api.together.xyz/v1",
    "CEREBRAS": "https://api.cerebras.ai/v1",
    "CUSTOM_OPENAI": "http://localhost:11434/v1",
}

PROVIDER_DISPLAY_NAMES: dict[str, str] = {
    "OPENAI": "OpenAI",
    "META_MUSE": "Meta Muse Spark",
    "MISTRAL": "Mistral AI",
    "GROQ": "Groq",
    "OPENROUTER": "OpenRouter",
    "DEEPSEEK": "DeepSeek",
    "TOGETHER": "Together AI",
    "CEREBRAS": "Cerebras",
    "CUSTOM_OPENAI": "Ollama / Compatible OpenAI",
}


class OpenAICompatibleProvider(LlmProvider):
    def __init__(
        self,
        provider_id: str,
        model: str,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> None:
        super().__init__(model=model, api_key=api_key, base_url=base_url)
        self.provider_id = provider_id.upper()
        self.provider_name = PROVIDER_DISPLAY_NAMES.get(self.provider_id, self.provider_id)

        # Resolve effective baseUrl
        effective_base_url = self.base_url or DEFAULT_BASE_URLS.get(self.provider_id)
        if effective_base_url:
            validate_provider_base_url(effective_base_url)
        self.effective_base_url = effective_base_url

    def _get_client(self) -> openai.OpenAI:
        # Custom local endpoints (like Ollama) may work without an API key,
        # but OpenAI client requires a non-empty string or dummy placeholder.
        api_key = self.api_key or ("dummy-local-key" if self.provider_id == "CUSTOM_OPENAI" else None)
        if not api_key and self.provider_id != "CUSTOM_OPENAI":
            raise ValueError(f"Une clé API pour {self.provider_name} est obligatoire.")

        return openai.OpenAI(
            api_key=api_key,
            base_url=self.effective_base_url,
            timeout=10.0,
        )

    def generate_json(self, prompt: str, schema: type[T]) -> T:
        client = self._get_client()
        schema_json = json.dumps(schema.model_json_schema(), ensure_ascii=False)
        system_msg = (
            "Tu es l'assistant de modélisme haute couture d'ANGALY. Tu réponds exclusivement avec un objet JSON "
            f"strictement conforme au schéma JSON Schema suivant, sans aucun autre texte :\n{schema_json}"
        )

        try:
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )
        except Exception:
            # Fallback without response_format for models that don't support json_object mode
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
            )

        raw_text = completion.choices[0].message.content or "{}"
        cleaned = clean_json_text(raw_text)
        return schema.model_validate_json(cleaned)

    def test_connection(self) -> tuple[bool, int, str]:
        start = time.perf_counter()
        try:
            client = self._get_client()
            client.chat.completions.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            return True, latency_ms, f"Connexion {self.provider_name} réussie."
        except Exception as exc:
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            logger.warning("OpenAI-compatible connection test failed (%s): %s", self.provider_id, exc)
            return False, latency_ms, f"Échec de la connexion {self.provider_name} : {exc}"
