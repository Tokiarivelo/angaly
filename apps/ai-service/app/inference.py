"""Inference layer — AI model integration via Multi-Provider LLM architecture.
Supports Anthropic, Gemini, OpenAI, Mistral, Groq, OpenRouter, and custom endpoints.
Specified in docs/features/ai-providers.md §6.
"""

from __future__ import annotations

import logging

from .local_model import LOCAL_MODEL_VERSION, estimate_with_local_model, is_local_model_available
from .schemas import (
    PatternAiSuggestionRequest,
    PatternAiSuggestionResponse,
    PatternMeasurementEstimationRequest,
    PatternMeasurementEstimationResponse,
)
from .services.providers import get_llm_provider
from .services.providers.gemini_provider import GeminiProvider
from .size_charts import CHARTS, MEASUREMENT_KEYS, find_closest_entry

logger = logging.getLogger("angaly.ai_service")

# Default Gemini Flash model version
GEMINI_MODEL_VERSION = "gemini-2.5-flash"
_model_loaded = True

# Coupes reconnues côté Pattern Studio (apps/web/.../consts/cuts.const.ts)
KNOWN_CUT_TYPES = ["DROITE", "EVASEE", "SIRENE", "PRINCESSE", "AJUSTEE", "OVERSIZE"]


def is_model_loaded() -> bool:
    return _model_loaded


def _size_chart_context() -> str:
    """A short grounding excerpt of the standard size chart, used as reference
    context so the LLM's suggestions/estimations stay anatomically plausible
    instead of being pure guesses."""
    lines = []
    for gender, rows in CHARTS.items():
        for row in rows:
            values = ", ".join(f"{k}={row[k]}" for k in MEASUREMENT_KEYS)
            lines.append(f"{gender} {row['label']} (FR {row['frSize']}): {values}")
    return "\n".join(lines)


def suggest_pattern_parameters(
    request: PatternAiSuggestionRequest,
) -> PatternAiSuggestionResponse:
    """Suggests PatternParameters (packages/pattern-engine) from measurements
    and style choices using the configured LLM provider.
    """
    prompt = f"""
    Tu es un(e) modéliste expert(e) chez 'Angaly', une maison de couture sur-mesure.
    Propose des paramètres de patron pour un vêtement.

    Type de vêtement : {request.garment_type}
    Occasion : {request.occasion or 'N/A'}
    Style souhaité : {request.style or 'N/A'}
    Mesures connues (cm) : {request.measurements}

    Table de tailles standard (référence anatomique, cm) :
    {_size_chart_context()}

    Choisis suggestedCutType strictement parmi cette liste : {", ".join(KNOWN_CUT_TYPES)}.
    Propose des détails de construction pertinents (manches, col, longueur, etc.) dans
    suggestedDetails.
    Si une image d'inspiration est fournie, simule la détection de ses caractéristiques
    visuelles dans detectedInspirationFeatures.
    Image d'inspiration : {request.inspiration_image_url or 'Aucune'}
    """

    try:
        if request.provider:
            provider = get_llm_provider(request.provider)
            model_ver = request.provider.model
        else:
            provider = GeminiProvider(model=GEMINI_MODEL_VERSION)
            model_ver = GEMINI_MODEL_VERSION

        result = provider.generate_json(prompt, PatternAiSuggestionResponse)
        result.model_version = model_ver

        if result.suggested_cut_type not in KNOWN_CUT_TYPES:
            logger.warning(
                "LLM suggested an unknown cutType %r, falling back to DROITE",
                result.suggested_cut_type,
            )
            result.suggested_cut_type = "DROITE"

        if not request.inspiration_image_url:
            result.detected_inspiration_features = None

        return result
    except Exception as exc:
        logger.exception("suggest_pattern_parameters failed: %s, returning fallback suggestion", exc)
        return PatternAiSuggestionResponse(
            suggestedCutType="DROITE",
            suggestedDetails={},
            detectedInspirationFeatures=None,
            confidence=0.1,
            modelVersion="fallback-0.0.0",
        )


def estimate_missing_measurements(
    request: PatternMeasurementEstimationRequest,
) -> PatternMeasurementEstimationResponse:
    """Estimates plausible values for measurement keys the customer did not
    provide, grounded on the standard size chart, so pattern generation never
    falls back to a single fixed body regardless of who the customer is.

    This is always indicative (spec §18/§20-24): the caller must surface it as
    such and let a human confirm — never treated as a real measurement.
    """
    required_keys = [k for k in request.required_keys if k not in request.known_measurements]
    if not required_keys:
        return PatternMeasurementEstimationResponse(
            estimatedMeasurements={}, estimatedKeys=[], confidence=1.0, modelVersion="no-op"
        )

    # Check local statistical model preference
    is_local_pref = (
        request.model_preference == "LOCAL_STATISTICAL"
        or (request.provider and request.provider.provider.upper() == "LOCAL_STATISTICAL")
    )

    if is_local_pref:
        if is_local_model_available(request.gender):
            try:
                estimated, confidence = estimate_with_local_model(
                    request.known_measurements, request.gender, required_keys
                )
                return PatternMeasurementEstimationResponse(
                    estimatedMeasurements=estimated,
                    estimatedKeys=list(estimated.keys()),
                    confidence=confidence,
                    modelVersion=LOCAL_MODEL_VERSION,
                )
            except Exception:
                logger.exception("Local model estimation failed, falling back to LLM")
        else:
            logger.warning(
                "LOCAL_STATISTICAL requested but no artifact available for gender=%r — falling back to LLM",
                request.gender,
            )

    try:
        prompt = f"""
        Tu es un(e) modéliste expert(e) chez 'Angaly'. Un projet de patron pour un
        vêtement de type {request.garment_type} a des mesures manquantes.

        Mesures déjà connues (cm) : {request.known_measurements}
        Genre indicatif : {request.gender or 'inconnu'}
        Clés manquantes à estimer : {request.required_keys}

        Table de tailles standard (référence anatomique, cm) :
        {_size_chart_context()}

        En te basant sur les proportions anatomiques usuelles et la table de tailles
        ci-dessus, estime une valeur plausible en centimètres pour CHAQUE clé manquante
        listée. Réponds uniquement avec les clés demandées dans estimatedMeasurements,
        recopie ces mêmes clés dans estimatedKeys, et donne un confidence bas (< 0.5)
        car il s'agit d'une estimation, jamais d'une mesure réelle.
        """

        if request.provider and request.provider.provider.upper() != "LOCAL_STATISTICAL":
            provider = get_llm_provider(request.provider)
            model_ver = request.provider.model
        else:
            provider = GeminiProvider(model=GEMINI_MODEL_VERSION)
            model_ver = GEMINI_MODEL_VERSION

        result = provider.generate_json(prompt, PatternMeasurementEstimationResponse)
        result.model_version = model_ver

        # Keep only the keys we were actually asked for — never let the LLM
        # smuggle in ungrounded extra keys.
        result.estimated_measurements = {
            k: v for k, v in result.estimated_measurements.items() if k in required_keys
        }
        result.estimated_keys = list(result.estimated_measurements.keys())
        return result
    except Exception as exc:
        logger.exception("estimate_missing_measurements failed: %s, using nearest size-chart entry", exc)
        closest = find_closest_entry(request.gender, request.known_measurements)
        estimated = {k: closest[k] for k in required_keys if k in closest}
        return PatternMeasurementEstimationResponse(
            estimatedMeasurements=estimated,
            estimatedKeys=list(estimated.keys()),
            confidence=0.2,
            modelVersion="fallback-size-chart-0.0.0",
        )
