import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  AiUsage,
  type InspirationAnalysisResponse,
  type ProviderCredentials,
} from '@angaly/types';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AiProviderResolverService } from '../services/ai-provider-resolver.service';
import {
  INSPIRATION_ANALYSIS_REPOSITORY,
  type IInspirationAnalysisRepository,
} from '../../domain/repositories/inspiration-analysis.repository';
import {
  INSPIRATION_IMAGE_PREPROCESSOR,
  type IInspirationImagePreprocessor,
} from '../../domain/services/inspiration-image-preprocessor.service';

/**
 * Photo → compact garment attributes, paying for image tokens at most once per distinct photo:
 * download → hash → cache hit? return : downscale (≈1k px) → one vision call → cache the JSON.
 * Every later suggestion works from this text, never from the image.
 */
@Injectable()
export class AnalyzeInspirationImageUseCase {
  constructor(
    @Inject(INSPIRATION_IMAGE_PREPROCESSOR)
    private readonly preprocessor: IInspirationImagePreprocessor,
    @Inject(INSPIRATION_ANALYSIS_REPOSITORY)
    private readonly repository: IInspirationAnalysisRepository,
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
  ) {}

  async execute(
    imageUrl: string,
    provider?: ProviderCredentials,
  ): Promise<InspirationAnalysisResponse> {
    const original = await this.preprocessor.fetchOriginal(imageUrl);
    const imageHash = createHash('sha256').update(original).digest('hex');

    const cached = await this.repository.findByHash(imageHash);
    if (cached) return cached;

    const image = await this.preprocessor.downscale(original);
    const credentials =
      provider ?? (await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION));

    const analysis = await this.aiClient.analyzeInspiration({
      imageBase64: image.buffer.toString('base64'),
      mimeType: image.mimeType,
      ...(credentials ? { provider: credentials } : {}),
    });

    // A failed/fallback analysis must not poison the cache: the next attempt should retry the model.
    if (analysis.confidence > 0 && !analysis.modelVersion.startsWith('fallback')) {
      await this.repository.save(imageHash, analysis);
    }
    return analysis;
  }
}
