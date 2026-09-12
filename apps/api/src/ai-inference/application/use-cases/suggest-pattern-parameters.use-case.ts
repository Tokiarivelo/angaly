import { Injectable } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';

@Injectable()
export class SuggestPatternParametersUseCase {
  constructor(private readonly aiClient: AiServiceHttpClient) {}

  async execute(request: PatternAiSuggestionRequest): Promise<{
    suggestion: PatternAiSuggestionResponse;
    isIndicativeOnly: boolean;
  }> {
    const suggestion = await this.aiClient.suggestPatternParameters(request);
    
    // Evaluate confidence score
    const confidence = new ConfidenceScore(suggestion.confidence);
    const isIndicativeOnly = confidence.isIndicativeOnly() || suggestion.modelVersion.includes('placeholder') || suggestion.modelVersion.includes('fallback');

    return {
      suggestion,
      isIndicativeOnly,
    };
  }
}
