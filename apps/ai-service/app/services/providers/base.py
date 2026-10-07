"""Base abstraction for LLM providers in ANGALY AI Service.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def clean_json_text(text: str) -> str:
    """Strips markdown code fences (```json ... ```) or leading/trailing whitespace
    to ensure clean JSON parsing from various LLM outputs.
    """
    stripped = text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", stripped, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return stripped


class LlmProvider(ABC):
    """Abstract interface that all AI providers (Anthropic, Gemini, OpenAI-compatible)
    must implement for structured JSON generation and connectivity diagnostics.
    """

    def __init__(self, model: str, api_key: str | None = None, base_url: str | None = None) -> None:
        self.model = model
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    def generate_json(self, prompt: str, schema: type[T]) -> T:
        """Generates structured output adhering strictly to the given Pydantic schema."""
        pass

    @abstractmethod
    def test_connection(self) -> tuple[bool, int, str]:
        """Tests connectivity and credentials with the provider.
        Returns (success: bool, latency_ms: int, message: str).
        """
        pass
