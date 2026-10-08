import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AiUsage,
  type InspirationAnalysisResponse,
  type ProviderCredentials,
} from '@angaly/types';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { CollectAiTrainingSampleUseCase } from './collect-ai-training-sample.use-case';
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
  private readonly logger = new Logger(AnalyzeInspirationImageUseCase.name);

  constructor(
    @Inject(INSPIRATION_IMAGE_PREPROCESSOR)
    private readonly preprocessor: IInspirationImagePreprocessor,
    @Inject(INSPIRATION_ANALYSIS_REPOSITORY)
    private readonly repository: IInspirationAnalysisRepository,
    private readonly aiClient: AiServiceHttpClient,
    private readonly providerResolver: AiProviderResolverService,
    private readonly trainingCollector: CollectAiTrainingSampleUseCase,
  ) {}

  async execute(
    imageUrl: string,
    provider?: ProviderCredentials,
  ): Promise<InspirationAnalysisResponse> {
    const original = await this.preprocessor.fetchOriginal(imageUrl);
    this.logger.log(`Photo downloaded (${Math.round(original.length / 1024)} KB) from ${new URL(imageUrl).host}`);
    const imageHash = createHash('sha256').update(original).digest('hex');

    // Always the model selected in the settings (or explicitly chosen by the customer) — never a
    // silent substitute. A cached answer is reused only if that same model produced it.
    const credentials =
      provider ?? (await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION));

    this.logger.log(
      `Analysing photo ${imageHash.slice(0, 8)} with ${credentials ? `${credentials.provider}/${credentials.model}` : 'NO PROVIDER (ai-service default)'}`,
    );
    const cached = await this.repository.findByHash(imageHash);
    if (cached?.profile && (!credentials || cached.modelVersion === credentials.model)) {
      this.logger.log(`Cache hit for ${imageHash.slice(0, 8)} (model ${cached.modelVersion})`);
      return cached;
    }
    this.logger.log(`Cache miss for ${imageHash.slice(0, 8)}${cached ? ` (cached by ${cached.modelVersion}, profile=${Boolean(cached.profile)})` : ''}`);

    const image = await this.preprocessor.downscale(original);

    const analysis = await this.aiClient.analyzeInspiration({
      imageBase64: image.buffer.toString('base64'),
      mimeType: image.mimeType,
      ...(credentials ? { provider: credentials } : {}),
    });

    // A failed/fallback analysis must not poison the cache: the next attempt should retry the model.
    if (analysis.confidence <= 0 || analysis.modelVersion.startsWith('fallback')) {
      this.logger.warn(`Analysis of ${imageHash.slice(0, 8)} not cached (fallback or zero confidence)`);
    }
    if (analysis.confidence > 0 && !analysis.modelVersion.startsWith('fallback')) {
      await this.repository.save(imageHash, analysis);
      // Every fresh external answer is also a training pair for the local model.
      await this.trainingCollector.collectInspirationAnalysis({
        imageHash,
        imageUrl,
        providerId: credentials?.provider ?? null,
        analysis,
      });
    }
    return analysis;
  }
}
