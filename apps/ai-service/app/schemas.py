"""Pydantic contracts for the AI service.

Keep in sync with PatternAiSuggestionRequest/Response and ProviderCredentials in
packages/types/src/index.ts and packages/types/src/ai-providers.ts — that is the
source of truth for the shape the NestJS `ai-inference` module sends and expects.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProviderCredentials(BaseModel):
    """Credentials and configuration for an external or custom LLM provider."""
    provider: str
    model: str
    api_key: str | None = Field(default=None, alias="apiKey")
    base_url: str | None = Field(default=None, alias="baseUrl")

    model_config = {"populate_by_name": True}

    def __repr__(self) -> str:
        # Guarantee API keys are never exposed in log output or repr
        masked = f"••••{self.api_key[-4:]}" if self.api_key and len(self.api_key) >= 4 else "***"
        return f"ProviderCredentials(provider={self.provider!r}, model={self.model!r}, apiKey={masked!r}, baseUrl={self.base_url!r})"


class TestProviderRequest(BaseModel):
    """Payload sent by NestJS admin-ai-settings to test provider connectivity."""
    provider: str
    model: str
    api_key: str | None = Field(default=None, alias="apiKey")
    base_url: str | None = Field(default=None, alias="baseUrl")

    model_config = {"populate_by_name": True}


class TestProviderResponse(BaseModel):
    """Response returned after running a connection test with the provider."""
    provider: str
    status: str  # "OK" | "INVALID"
    latency_ms: int = Field(..., alias="latencyMs")
    message: str | None = None

    model_config = {"populate_by_name": True}


class PatternAiSuggestionRequest(BaseModel):
    garment_type: str = Field(..., alias="garmentType")
    occasion: str | None = None
    style: str | None = None
    measurements: dict[str, float] = Field(default_factory=dict)
    inspiration_image_url: str | None = Field(default=None, alias="inspirationImageUrl")
    # Compact attributes extracted once from the photo (see analyze-inspiration) — replaces the
    # image in the prompt so the suggestion call stays text-only and cheap.
    inspiration_features: dict[str, str] | None = Field(default=None, alias="inspirationFeatures")
    provider: ProviderCredentials | None = None

    model_config = {"populate_by_name": True}


class PatternAiSuggestionResponse(BaseModel):
    suggested_cut_type: str = Field(..., alias="suggestedCutType")
    suggested_details: dict[str, str] = Field(default_factory=dict, alias="suggestedDetails")
    detected_inspiration_features: dict[str, str] | None = Field(
        default=None, alias="detectedInspirationFeatures"
    )
    confidence: float
    model_version: str = Field(..., alias="modelVersion")

    model_config = {"populate_by_name": True}


class HealthCheckResponse(BaseModel):
    status: str
    model_loaded: bool = Field(..., alias="modelLoaded")

    model_config = {"populate_by_name": True}


class AvailableModelsResponse(BaseModel):
    """Lists which model backends are actually usable right now, so the admin
    settings screen can grey out a choice whose artifact isn't loaded rather
    than let an admin pick a model that will silently fall back."""

    measurement_estimation: list[str] = Field(..., alias="measurementEstimation")

    model_config = {"populate_by_name": True}


class PatternMeasurementEstimationRequest(BaseModel):
    garment_type: str = Field(..., alias="garmentType")
    gender: str | None = None
    known_measurements: dict[str, float] = Field(default_factory=dict, alias="knownMeasurements")
    required_keys: list[str] = Field(default_factory=list, alias="requiredKeys")
    # 'GEMINI' (default) or 'LOCAL_STATISTICAL' — admin-controlled, see
    # docs/features/ai-model-settings.md.
    model_preference: str = Field(default="GEMINI", alias="modelPreference")
    provider: ProviderCredentials | None = None

    model_config = {"populate_by_name": True}


class PatternMeasurementEstimationResponse(BaseModel):
    estimated_measurements: dict[str, float] = Field(
        default_factory=dict, alias="estimatedMeasurements"
    )
    estimated_keys: list[str] = Field(default_factory=list, alias="estimatedKeys")
    confidence: float
    model_version: str = Field(..., alias="modelVersion")

    model_config = {"populate_by_name": True}


class InspirationAnalysisRequest(BaseModel):
    """One already downscaled inspiration photo, sent by NestJS `ai-inference` (never by the web)."""
    image_base64: str = Field(..., alias="imageBase64")
    mime_type: str = Field(default="image/jpeg", alias="mimeType")
    provider: ProviderCredentials | None = None

    model_config = {"populate_by_name": True}


class InspirationAnalysisResponse(BaseModel):
    """Garment attributes read from the photo — descriptive only, never geometry."""
    features: dict[str, str] = Field(default_factory=dict)
    suggested_cut_type: str | None = Field(default=None, alias="suggestedCutType")
    confidence: float
    model_version: str = Field(..., alias="modelVersion")

    model_config = {"populate_by_name": True}
