"""Inference layer — isolated from FastAPI routing so a real model can be
dropped in (Phase 5, docs/phases/phase-5-ai-avancee.md) without touching
app/main.py. Until then, both functions return deterministic placeholders so
the NestJS side has a stable contract to build and test against.
"""

from __future__ import annotations

from .schemas import PatternAiSuggestionRequest, PatternAiSuggestionResponse

PLACEHOLDER_MODEL_VERSION = "placeholder-0.0.0"

# Populated once a real model artifact exists under ml/scripts/ (see README.md).
_model_loaded = False


def is_model_loaded() -> bool:
    return _model_loaded


def suggest_pattern_parameters(
    request: PatternAiSuggestionRequest,
) -> PatternAiSuggestionResponse:
    """Suggests PatternParameters (packages/pattern-engine) from measurements
    and style choices. Never produces geometry — the couturière reviews and
    confirms these suggestions before @angaly/pattern-engine constructs the
    actual pattern pieces (spec §25)."""
    return PatternAiSuggestionResponse(
        suggestedCutType="DROITE",
        suggestedDetails={},
        detectedInspirationFeatures=(
            {"note": "Aucune analyse d'image — modèle non entraîné (Phase 5)"}
            if request.inspiration_image_url
            else None
        ),
        confidence=0.0,
        modelVersion=PLACEHOLDER_MODEL_VERSION,
    )
