import { Injectable } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AiUsage, PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { AiProviderResolverService } from '../services/ai-provider-resolver.service';

@Injectable()
export class SuggestPatternParametersUseCase {
  constructor(
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
  ) {}

  async execute(request: PatternAiSuggestionRequest): Promise<{
    suggestion: PatternAiSuggestionResponse;
    isIndicativeOnly: boolean;
  }> {
    const provider = request.provider ?? (await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION));

    const suggestion = await this.aiClient.suggestPatternParameters({
      ...request,
      provider,
    });

    // Evaluate confidence score
    const confidence = new ConfidenceScore(suggestion.confidence);
    const isIndicativeOnly =
      confidence.isIndicativeOnly() ||
      suggestion.modelVersion.includes('placeholder') ||
      suggestion.modelVersion.includes('fallback');

    return {
      suggestion,
      isIndicativeOnly,
    };
  }
}
