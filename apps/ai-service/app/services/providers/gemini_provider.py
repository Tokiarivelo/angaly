"""Google Gemini LLM provider adapter using the google-genai SDK.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

import logging
import time
from typing import TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel

from .base import LlmProvider

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("angaly.ai_service.gemini")


class GeminiProvider(LlmProvider):
    def __init__(self, model: str = "gemini-2.5-flash", api_key: str | None = None) -> None:
        super().__init__(model=model, api_key=api_key)

    def _get_client(self) -> genai.Client:
        if self.api_key:
            return genai.Client(api_key=self.api_key)
        return genai.Client()

    def generate_json(self, prompt: str, schema: type[T]) -> T:
        client = self._get_client()
        response = client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        return schema.model_validate_json(response.text)

    def test_connection(self) -> tuple[bool, int, str]:
        start = time.perf_counter()
        try:
            client = self._get_client()
            client.models.generate_content(
                model=self.model,
                contents="ping",
                config=types.GenerateContentConfig(max_output_tokens=1),
            )
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            return True, latency_ms, "Connexion Google Gemini réussie."
        except Exception as exc:
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            logger.warning("Gemini connection test failed: %s", exc)
            return False, latency_ms, f"Échec de la connexion Gemini : {exc}"
