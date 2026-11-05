"""Runtime switches read from the environment (read on each call, so tests can change them)."""

from __future__ import annotations

import os

_TRUE = {"1", "true", "yes", "on"}


def local_models_enabled() -> bool:
    """Self-hosted models (ANSUR II imputer, CLIP photo model): off unless
    AI_LOCAL_MODELS_ENABLED=true.

    Off by default for now: the CLIP encoder uses every CPU core and made the dev machine
    unstable. The configured providers (Gemini, Anthropic, OpenAI…) answer instead, with
    their usual fallbacks.
    """
    return os.environ.get("AI_LOCAL_MODELS_ENABLED", "").strip().lower() in _TRUE
