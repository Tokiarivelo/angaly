import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AiProviderId,
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

/** One model tried for a photo: who, and why it did not produce the answer (absent when it did). */
export interface AnalysisAttempt {
  provider: string;
  model: string;
  outcome: 'OK' | 'FAILED' | 'SKIPPED_NO_VISION';
}

export interface InspirationAnalysisOutcome {
  analysis: InspirationAnalysisResponse;
  attempts: AnalysisAttempt[];
}

const sameModel = (a: ProviderCredentials, b: ProviderCredentials): boolean =>
  a.provider === b.provider && a.model === b.model;

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
    return (await this.executeWithAttempts(imageUrl, provider)).analysis;
  }

  /**
   * Same as `execute`, plus the list of models tried. The chosen (or default) model goes first; when it
   * cannot read photos (the local statistical model) or fails, the admin's ordered fallbacks are tried
   * until one answers. A cached answer is reused only if one of the candidate models produced it.
   */
  async executeWithAttempts(
    imageUrl: string,
    provider?: ProviderCredentials,
  ): Promise<InspirationAnalysisOutcome> {
    const original = await this.preprocessor.fetchOriginal(imageUrl);
    this.logger.log(`Photo downloaded (${Math.round(original.length / 1024)} KB) from ${new URL(imageUrl).host}`);
    const imageHash = createHash('sha256').update(original).digest('hex');

    const primary =
      provider ?? (await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION));
    const attempts: AnalysisAttempt[] = [];
    const candidates: ProviderCredentials[] = [];
    const addCandidate = (credentials: ProviderCredentials | undefined) => {
      if (credentials && !candidates.some((c) => sameModel(c, credentials))) candidates.push(credentials);
    };

    if (primary?.provider === AiProviderId.LOCAL_STATISTICAL) {
      // The local model only estimates measurements — it has no vision. Say so, then use the atelier's
      // default and fallbacks instead of failing the whole analysis.
      attempts.push({ provider: primary.provider, model: primary.model, outcome: 'SKIPPED_NO_VISION' });
      this.logger.warn('Local statistical model cannot read photos — using the atelier default/fallback models');
      const atelierDefault = await this.providerResolver.resolveCredentials(AiUsage.PATTERN_SUGGESTION);
      if (atelierDefault?.provider !== AiProviderId.LOCAL_STATISTICAL) addCandidate(atelierDefault);
    } else {
      addCandidate(primary);
    }
    for (const fallback of await this.providerResolver.resolveFallbackChain(AiUsage.PATTERN_SUGGESTION)) {
      addCandidate(fallback);
    }

    this.logger.log(
      `Analysing photo ${imageHash.slice(0, 8)} with ${candidates.length ? candidates.map((c) => `${c.provider}/${c.model}`).join(' → ') : 'NO PROVIDER (ai-service default)'}`,
    );
    const cached = await this.repository.findByHash(imageHash);
    if (cached?.profile && (!candidates.length || candidates.some((c) => c.model === cached.modelVersion))) {
      this.logger.log(`Cache hit for ${imageHash.slice(0, 8)} (model ${cached.modelVersion})`);
      attempts.push({ provider: 'cache', model: cached.modelVersion, outcome: 'OK' });
      return { analysis: cached, attempts };
    }
    this.logger.log(`Cache miss for ${imageHash.slice(0, 8)}${cached ? ` (cached by ${cached.modelVersion}, profile=${Boolean(cached.profile)})` : ''}`);

    const image = await this.preprocessor.downscale(original);
    const imageBase64 = image.buffer.toString('base64');

    // `undefined` = no explicit provider: the ai-service default (Gemini via its own env).
    const plan: Array<ProviderCredentials | undefined> = candidates.length ? candidates : [undefined];
    let analysis: InspirationAnalysisResponse | undefined;
    let usedCredentials: ProviderCredentials | undefined;
    for (const credentials of plan) {
      const label = credentials ? { provider: credentials.provider, model: credentials.model } : { provider: 'default', model: 'default' };
      let result: InspirationAnalysisResponse | undefined;
      try {
        result = await this.aiClient.analyzeInspiration({
          imageBase64,
          mimeType: image.mimeType,
          ...(credentials ? { provider: credentials } : {}),
        });
      } catch (error) {
        this.logger.warn(`${label.provider}/${label.model} threw: ${error instanceof Error ? error.message : String(error)}`);
      }
      analysis = result ?? analysis;
      if (result && result.confidence > 0 && !result.modelVersion.startsWith('fallback')) {
        attempts.push({ ...label, outcome: 'OK' });
        analysis = result;
        usedCredentials = credentials;
        break;
      }
      attempts.push({ ...label, outcome: 'FAILED' });
      this.logger.warn(`Analysis of ${imageHash.slice(0, 8)} failed with ${label.provider}/${label.model}${plan.length > 1 ? ' — trying the next model' : ''}`);
    }

    if (!analysis) {
      // Every model threw: surface the same neutral "fallback" answer the ai-service would give.
      analysis = { features: {}, profile: null, suggestedCutType: null, confidence: 0, modelVersion: 'fallback-0.0.0' };
    }

    const succeeded = attempts[attempts.length - 1]?.outcome === 'OK';
    if (!succeeded) {
      // A failed/fallback analysis must not poison the cache: the next attempt should retry the models.
      this.logger.warn(`Analysis of ${imageHash.slice(0, 8)} not cached (fallback or zero confidence)`);
    } else {
      await this.repository.save(imageHash, analysis);
      // Every fresh external answer is also a training pair for the local model.
      await this.trainingCollector.collectInspirationAnalysis({
        imageHash,
        imageUrl,
        providerId: usedCredentials?.provider ?? null,
        analysis,
      });
    }
    return { analysis, attempts };
  }
}
