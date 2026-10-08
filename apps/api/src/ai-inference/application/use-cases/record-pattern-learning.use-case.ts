import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollectAiTrainingSampleUseCase } from './collect-ai-training-sample.use-case';
import {
  PATTERN_LEARNING_REPOSITORY,
  type IPatternLearningRepository,
  type PatternLearningRecordData,
} from '../../domain/repositories/pattern-learning.repository';

/**
 * Feeds the learning loop. Best-effort by design: a failure here must never fail a generation
 * or an export, so errors are logged and swallowed.
 */
@Injectable()
export class RecordPatternLearningUseCase {
  private readonly logger = new Logger(RecordPatternLearningUseCase.name);

  constructor(
    @Inject(PATTERN_LEARNING_REPOSITORY)
    private readonly repository: IPatternLearningRepository,
    private readonly trainingCollector: CollectAiTrainingSampleUseCase,
  ) {}

  async recordGenerated(data: PatternLearningRecordData): Promise<void> {
    try {
      await this.repository.upsertGenerated(data);
      await this.trainingCollector.confirmInspirationLabel(data.inspirationMediaId, data);
    } catch (error) {
      this.logger.warn(`Learning record skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async recordExported(patternProjectId: string): Promise<void> {
    try {
      await this.repository.markExported(patternProjectId);
    } catch (error) {
      this.logger.warn(`Learning export mark skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
