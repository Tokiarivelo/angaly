import logging

from fastapi import FastAPI
from pydantic import BaseModel

from .inference import estimate_missing_measurements, is_model_loaded, suggest_pattern_parameters
from .local_model import is_local_model_available
from .schemas import (
    AvailableModelsResponse,
    HealthCheckResponse,
    PatternAiSuggestionRequest,
    PatternAiSuggestionResponse,
    PatternMeasurementEstimationRequest,
    PatternMeasurementEstimationResponse,
)

logger = logging.getLogger("angaly.ai_service")

app = FastAPI(
    title="ANGALY AI Service",
    description="Deep-learning assistance for Angaly Pattern Studio.",
    version="0.1.0-foundation",
)


@app.get("/health", response_model=HealthCheckResponse, response_model_by_alias=True)
def health() -> HealthCheckResponse:
    return HealthCheckResponse(status="ok", modelLoaded=is_model_loaded())


@app.get("/v1/models", response_model=AvailableModelsResponse, response_model_by_alias=True)
def available_models() -> AvailableModelsResponse:
    """Called by the NestJS `ai-inference` module's admin settings endpoint
    to know which model choices are actually usable (docs/features/ai-model-settings.md)."""
    options = ["GEMINI"]
    if is_local_model_available("FEMME") or is_local_model_available("HOMME"):
        options.append("LOCAL_STATISTICAL")
    return AvailableModelsResponse(measurementEstimation=options)


@app.post(
    "/v1/pattern/suggest-parameters",
    response_model=PatternAiSuggestionResponse,
    response_model_by_alias=True,
)
def suggest_parameters(payload: PatternAiSuggestionRequest) -> PatternAiSuggestionResponse:
    """Called by the NestJS `ai-inference` module during Pattern Studio's
    generation step (docs/pages/pattern-studio-wizard.md)."""
    return suggest_pattern_parameters(payload)


@app.post(
    "/v1/pattern/estimate-measurements",
    response_model=PatternMeasurementEstimationResponse,
    response_model_by_alias=True,
)
def estimate_measurements(
    payload: PatternMeasurementEstimationRequest,
) -> PatternMeasurementEstimationResponse:
    """Called by the NestJS `ai-inference` module when a pattern generation
    is missing required measurements — estimates plausible values, always
    indicative, grounded on the standard size chart (docs/features/ai-inference.md)."""
    return estimate_missing_measurements(payload)


class ChatMessageRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    response: str


@app.post("/v1/chat/assistant", response_model=ChatMessageResponse)
def chat_assistant(payload: ChatMessageRequest) -> ChatMessageResponse:
    from google import genai

    try:
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are a helpful and polite assistant for the Angaly tailor shop. Respond to this user message: {payload.message}",
        )
        return ChatMessageResponse(response=response.text)
    except Exception:
        logger.exception("chat_assistant failed, returning fallback response")
        return ChatMessageResponse(
            response=(
                "Bonjour ! Je suis l'assistant Angaly. Je rencontre une difficulté "
                "technique, réessayez dans un instant."
            )
        )
