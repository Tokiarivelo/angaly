export const PATTERN_LEARNING_REPOSITORY = Symbol('IPatternLearningRepository');

export type PatternLearningOutcomeValue = 'GENERATED' | 'EXPORTED';

export interface PatternLearningRecordData {
  patternProjectId: string;
  garmentType: string;
  occasion: string | null;
  style: string | null;
  cutType: string;
  details: Record<string, string>;
}

export interface PatternLearningRow {
  cutType: string;
  occasion: string | null;
  style: string | null;
  details: Record<string, string>;
  outcome: PatternLearningOutcomeValue;
}

export interface IPatternLearningRepository {
  /** One row per project: refreshed on regeneration, never downgraded from EXPORTED. */
  upsertGenerated(data: PatternLearningRecordData): Promise<void>;
  markExported(patternProjectId: string): Promise<void>;
  findRecentByGarmentType(garmentType: string, limit: number): Promise<PatternLearningRow[]>;
}
