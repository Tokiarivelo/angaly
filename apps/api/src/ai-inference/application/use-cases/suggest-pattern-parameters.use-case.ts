import { Injectable, Logger } from '@nestjs/common';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import {
  AiUsage,
  type LearnedPreferences,
  PatternAiSuggestionRequest,
  PatternAiSuggestionResponse,
} from '@angaly/types';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { AiProviderResolverService } from '../services/ai-provider-resolver.service';
import { PatternLearningService } from '../services/pattern-learning.service';
import { AnalyzeInspirationImageUseCase } from './analyze-inspiration-image.use-case';

@Injectable()
export class SuggestPatternParametersUseCase {
  constructor(
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
    private readonly analyzeInspirationImage: AnalyzeInspirationImageUseCase,
    private readonly patternLearning: PatternLearningService,
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

    // What the atelier's clients actually built for similar projects (never blocks the suggestion).
    const learnedPreferences =
      request.learnedPreferences ??
      (await this.patternLearning
        .buildPreferences(request.garmentType, { occasion: request.occasion, style: request.style })
        .catch(() => null));

    let suggestion = await this.aiClient.suggestPatternParameters({
      ...request,
      inspirationImageUrl: null,
      inspirationFeatures,
      learnedPreferences,
      provider,
    });

    // The AI is unreachable: fall back on the atelier's own history rather than a blind default.
    if (suggestion.confidence === 0 && suggestion.modelVersion.startsWith('fallback')) {
      suggestion = this.suggestFromLearning(suggestion, learnedPreferences);
    }

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

  private suggestFromLearning(
    fallback: PatternAiSuggestionResponse,
    learned: LearnedPreferences | null,
  ): PatternAiSuggestionResponse {
    const best = Object.entries(learned?.cutTypes ?? {}).sort((a, b) => b[1] - a[1])[0];
    if (!learned || !best) return fallback;

    return {
      ...fallback,
      suggestedCutType: best[0],
      suggestedDetails: Object.fromEntries(
        Object.entries(learned.details).map(([key, { value }]) => [key, value]),
      ),
      // Capped under the 0.5 indicative threshold: a statistical habit, not a reasoned proposal.
      confidence: Math.min(0.45, best[1]),
      modelVersion: 'learned-history-1',
    };
  }
}
