-- Ordered fallback providers for photo analysis / pattern suggestions.
ALTER TABLE "ai_model_settings" ADD COLUMN "patternSuggestionFallbacks" "AiProviderId"[] DEFAULT ARRAY[]::"AiProviderId"[];
