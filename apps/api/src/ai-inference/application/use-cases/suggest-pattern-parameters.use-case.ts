import { Injectable, Logger } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AiUsage, PatternAiSuggestionRequest, PatternAiSuggestionResponse } from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { AiProviderResolverService } from '../services/ai-provider-resolver.service';
import { AnalyzeInspirationImageUseCase } from './analyze-inspiration-image.use-case';

@Injectable()
export class SuggestPatternParametersUseCase {
  constructor(
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
    private readonly analyzeInspirationImage: AnalyzeInspirationImageUseCase,
  ) {}

  private readonly logger = new Logger(SuggestPatternParametersUseCase.name);

  async execute(request: PatternAiSuggestionRequest): Promise<{
    suggestion: PatternAiSuggestionResponse;
    isIndicativeOnly: boolean;
  }> {
    const provider = request.provider ?? (await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION));

    // The photo is read once by a vision call (cached by hash); the suggestion itself stays text-only.
    let inspirationFeatures = request.inspirationFeatures ?? null;
    if (request.inspirationImageUrl && !inspirationFeatures) {
      try {
        const analysis = await this.analyzeInspirationImage.execute(
          request.inspirationImageUrl,
          provider,
        );
        inspirationFeatures = Object.keys(analysis.features).length > 0 ? analysis.features : null;
      } catch (error) {
        this.logger.warn(
          `Inspiration image ignored: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const suggestion = await this.aiClient.suggestPatternParameters({
      ...request,
      inspirationImageUrl: null,
      inspirationFeatures,
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
