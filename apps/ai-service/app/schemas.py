"""Pydantic contracts for the AI service.

Keep in sync with PatternAiSuggestionRequest/Response in
packages/types/src/index.ts — that file is the source of truth for the shape
the NestJS `ai-inference` module sends and expects.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class PatternAiSuggestionRequest(BaseModel):
    garment_type: str = Field(..., alias="garmentType")
    occasion: str | None = None
    style: str | None = None
    measurements: dict[str, float] = Field(default_factory=dict)
    inspiration_image_url: str | None = Field(default=None, alias="inspirationImageUrl")

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
    # docs/features/ai-model-settings.md. Falls back to Gemini if the local
    # model artifact isn't available.
    model_preference: str = Field(default="GEMINI", alias="modelPreference")

    model_config = {"populate_by_name": True}


class PatternMeasurementEstimationResponse(BaseModel):
    estimated_measurements: dict[str, float] = Field(
        default_factory=dict, alias="estimatedMeasurements"
    )
    estimated_keys: list[str] = Field(default_factory=list, alias="estimatedKeys")
    confidence: float
    model_version: str = Field(..., alias="modelVersion")

    model_config = {"populate_by_name": True}
