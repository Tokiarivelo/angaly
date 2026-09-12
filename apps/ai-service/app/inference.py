"""Inference layer — AI model integration via Gemini API.
Uses google-genai to provide structured suggestions for Pattern Studio.
"""

from __future__ import annotations

import os
from google import genai
from google.genai import types

from .schemas import PatternAiSuggestionRequest, PatternAiSuggestionResponse

# Uses Gemini Flash as the LLM for pattern suggestions
GEMINI_MODEL_VERSION = "gemini-2.5-flash"
_model_loaded = True

def is_model_loaded() -> bool:
    return _model_loaded

def suggest_pattern_parameters(
    request: PatternAiSuggestionRequest,
) -> PatternAiSuggestionResponse:
    """Suggests PatternParameters (packages/pattern-engine) from measurements
    and style choices using the Gemini LLM.
    """
    client = genai.Client() # Assumes GEMINI_API_KEY is in environment

    prompt = f"""
    You are an expert tailor and pattern maker for 'Angaly'. 
    Suggest pattern parameters for a garment.
    
    Garment Type: {request.garment_type}
    Occasion: {request.occasion or 'N/A'}
    Style: {request.style or 'N/A'}
    Measurements (cm): {request.measurements}
    
    Provide the suggested cut type (e.g. DROITE, EVASEE, SIRENE) and any specific details for the pattern.
    If an inspiration image URL is provided, simulate detecting features from it.
    Image URL: {request.inspiration_image_url or 'None'}
    """

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL_VERSION,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PatternAiSuggestionResponse,
            ),
        )
        
        # Pydantic validation
        result = PatternAiSuggestionResponse.model_validate_json(response.text)
        result.model_version = GEMINI_MODEL_VERSION
        
        if not request.inspiration_image_url:
            result.detected_inspiration_features = None
            
        return result
    except Exception as e:
        # Graceful fallback if Gemini fails
        return PatternAiSuggestionResponse(
            suggestedCutType="DROITE",
            suggestedDetails={"error": str(e)},
            detectedInspirationFeatures=None,
            confidence=0.1,
            modelVersion="fallback-0.0.0",
        )
