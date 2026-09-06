from fastapi import FastAPI

from .inference import is_model_loaded, suggest_pattern_parameters
from .schemas import HealthCheckResponse, PatternAiSuggestionRequest, PatternAiSuggestionResponse

app = FastAPI(
    title="ANGALY AI Service",
    description="Deep-learning assistance for Angaly Pattern Studio.",
    version="0.1.0-foundation",
)


@app.get("/health", response_model=HealthCheckResponse, response_model_by_alias=True)
def health() -> HealthCheckResponse:
    return HealthCheckResponse(status="ok", modelLoaded=is_model_loaded())


@app.post(
    "/v1/pattern/suggest-parameters",
    response_model=PatternAiSuggestionResponse,
    response_model_by_alias=True,
)
def suggest_parameters(payload: PatternAiSuggestionRequest) -> PatternAiSuggestionResponse:
    """Called by the NestJS `ai-inference` module during Pattern Studio's
    generation step (docs/pages/pattern-studio-wizard.md)."""
    return suggest_pattern_parameters(payload)
