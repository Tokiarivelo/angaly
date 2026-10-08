import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InspirationAnalysisResponse } from '@angaly/types';
import {
  AI_TRAINING_SAMPLE_REPOSITORY,
  type IAiTrainingSampleRepository,
} from '../../domain/repositories/ai-training-sample.repository';

export const INSPIRATION_ANALYSIS_TASK = 'INSPIRATION_ANALYSIS';

/**
 * Keeps what external models answer (and what customers finally chose) so a local model can be
 * trained on it later. Best-effort like the learning loop: it must never fail an analysis or a
 * generation. Switch off with AI_TRAINING_COLLECTION_ENABLED=false.
 */
@Injectable()
export class CollectAiTrainingSampleUseCase {
  private readonly logger = new Logger(CollectAiTrainingSampleUseCase.name);

  constructor(
    @Inject(AI_TRAINING_SAMPLE_REPOSITORY)
    private readonly repository: IAiTrainingSampleRepository,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    return this.config.get<string>('AI_TRAINING_COLLECTION_ENABLED') !== 'false';
  }

  /** A fresh answer from an external model. Fallbacks, empty answers and non-garments are skipped. */
  async collectInspirationAnalysis(input: {
    imageHash: string;
    imageUrl: string;
    providerId: string | null;
    analysis: InspirationAnalysisResponse;
  }): Promise<void> {
    const { analysis } = input;
    if (!this.enabled || !analysis.profile || analysis.modelVersion.startsWith('fallback')) return;
    if (analysis.confidence <= 0) return;
    try {
      await this.repository.saveIfAbsent({
        task: INSPIRATION_ANALYSIS_TASK,
        inputHash: input.imageHash,
        imageUrl: input.imageUrl,
        output: { profile: analysis.profile, features: analysis.features },
        providerId: input.providerId,
        modelVersion: analysis.modelVersion,
        confidence: analysis.confidence,
      });
    } catch (error) {
      this.logger.warn(`Training sample skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** The customer's final choices = a human-validated label for the photo they started from. */
  async confirmInspirationLabel(
    inspirationMediaId: string | null | undefined,
    label: {
      garmentType: string;
      occasion: string | null;
      style: string | null;
      cutType: string;
      details: Record<string, string>;
    },
  ): Promise<void> {
    if (!this.enabled || !inspirationMediaId) return;
    try {
      await this.repository.confirmLabelByMediaId(
        INSPIRATION_ANALYSIS_TASK,
        inspirationMediaId,
        { isGarment: true, ...label },
      );
    } catch (error) {
      this.logger.warn(`Training label skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
