import type { InspirationAnalysisResponse } from '@angaly/types';

export const INSPIRATION_ANALYSIS_REPOSITORY = Symbol('IInspirationAnalysisRepository');

/** Cache of vision results keyed on the SHA-256 of the original photo bytes. */
export interface IInspirationAnalysisRepository {
  findByHash(imageHash: string): Promise<InspirationAnalysisResponse | null>;
  save(imageHash: string, analysis: InspirationAnalysisResponse): Promise<void>;
}
