"""Anthropic Claude LLM provider adapter using the anthropic SDK.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

import base64
import json
import logging
import time
from typing import TypeVar

import anthropic
from pydantic import BaseModel

from .base import LlmProvider, clean_json_text

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("angaly.ai_service.anthropic")


class AnthropicProvider(LlmProvider):
    def __init__(self, model: str = "claude-sonnet-5-5", api_key: str | None = None) -> None:
        super().__init__(model=model, api_key=api_key)

    def _get_client(self) -> anthropic.Anthropic:
        if not self.api_key:
            raise ValueError("Une clé API Anthropic est obligatoire.")
        return anthropic.Anthropic(api_key=self.api_key)

    def generate_json(self, prompt: str, schema: type[T]) -> T:
        client = self._get_client()
        schema_json = json.dumps(schema.model_json_schema(), ensure_ascii=False)
        user_content = (
            f"{prompt}\n\n"
            "IMPORTANT : Réponds EXCLUSIVEMENT avec un objet JSON valide conforme à ce schéma JSON Schema, "
            f"sans aucun texte avant ou après :\n{schema_json}"
        )

        message = client.messages.create(
            model=self.model,
            max_tokens=2048,
            system="Tu es l'assistant de modélisme haute couture d'ANGALY. Tu réponds exclusivement en JSON valide.",
            messages=[{"role": "user", "content": user_content}],
        )

        raw_text = message.content[0].text if message.content else "{}"
        cleaned = clean_json_text(raw_text)
        return schema.model_validate_json(cleaned)

    def generate_json_from_image(
        self, prompt: str, schema: type[T], image_bytes: bytes, mime_type: str
    ) -> T:
        client = self._get_client()
        schema_json = json.dumps(schema.model_json_schema(), ensure_ascii=False)
        message = client.messages.create(
            model=self.model,
            max_tokens=1024,
            system="Tu es l'assistant de modélisme haute couture d'ANGALY. Tu réponds exclusivement en JSON valide.",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": base64.b64encode(image_bytes).decode("ascii"),
                            },
                        },
                        {
                            "type": "text",
                            "text": f"{prompt}\n\nRéponds EXCLUSIVEMENT avec un objet JSON conforme à ce schéma :\n{schema_json}",
                        },
                    ],
                }
            ],
        )
        raw_text = message.content[0].text if message.content else "{}"
        return schema.model_validate_json(clean_json_text(raw_text))

    def test_connection(self) -> tuple[bool, int, str]:
        start = time.perf_counter()
        try:
            client = self._get_client()
            client.messages.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}],
            )
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            return True, latency_ms, "Connexion Claude (Anthropic) réussie."
        except Exception as exc:
            latency_ms = max(1, int((time.perf_counter() - start) * 1000))
            logger.warning("Anthropic connection test failed: %s", exc)
            return False, latency_ms, f"Échec de la connexion Anthropic : {exc}"
