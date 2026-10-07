import { Inject, Injectable } from '@nestjs/common';
import type { LearnedPreferences } from '@angaly/types';
import {
  PATTERN_LEARNING_REPOSITORY,
  type IPatternLearningRepository,
  type PatternLearningRow,
} from '../../domain/repositories/pattern-learning.repository';

const HISTORY_LIMIT = 300;
/** Below this many weighted samples the data is noise: no hint is produced. */
export const MIN_WEIGHTED_SAMPLES = 5;
/** A choice must be shared by at least this fraction of similar projects to be reported. */
const MIN_SHARE = 0.3;
const OUTCOME_WEIGHT = { GENERATED: 1, EXPORTED: 3 } as const;
/** Same occasion/style projects are the closest evidence; they count double. */
const CONTEXT_MATCH_BONUS = 2;

/**
 * Turns past outcomes (what clients generated, and especially exported) into compact "learned
 * preferences" that ground future suggestions. Deterministic aggregation, no model training:
 * the pattern-engine remains the only source of geometry (ADR-005).
 */
@Injectable()
export class PatternLearningService {
  constructor(
    @Inject(PATTERN_LEARNING_REPOSITORY)
    private readonly repository: IPatternLearningRepository,
  ) {}

  async buildPreferences(
    garmentType: string,
    context: { occasion?: string | null; style?: string | null } = {},
  ): Promise<LearnedPreferences | null> {
    const rows = await this.repository.findRecentByGarmentType(garmentType, HISTORY_LIMIT);
    return PatternLearningService.aggregate(rows, context);
  }

  static aggregate(
    rows: PatternLearningRow[],
    context: { occasion?: string | null; style?: string | null },
  ): LearnedPreferences | null {
    const weigh = (row: PatternLearningRow): number => {
      const matches =
        (context.occasion && row.occasion === context.occasion) ||
        (context.style && row.style === context.style);
      return OUTCOME_WEIGHT[row.outcome] * (matches ? CONTEXT_MATCH_BONUS : 1);
    };

    const weighted = rows.map((row) => ({ row, weight: weigh(row) }));
    const total = weighted.reduce((sum, { weight }) => sum + weight, 0);
    if (total < MIN_WEIGHTED_SAMPLES) return null;

    const cutTotals = new Map<string, number>();
    const detailTotals = new Map<string, Map<string, number>>();
    const detailKeyTotals = new Map<string, number>();

    for (const { row, weight } of weighted) {
      cutTotals.set(row.cutType, (cutTotals.get(row.cutType) ?? 0) + weight);
      for (const [key, value] of Object.entries(row.details)) {
        if (!value) continue;
        const values = detailTotals.get(key) ?? new Map<string, number>();
        values.set(value, (values.get(value) ?? 0) + weight);
        detailTotals.set(key, values);
        detailKeyTotals.set(key, (detailKeyTotals.get(key) ?? 0) + weight);
      }
    }

    const cutTypes: Record<string, number> = {};
    for (const [cut, weight] of cutTotals) {
      const share = weight / total;
      if (share >= MIN_SHARE) cutTypes[cut] = Math.round(share * 100) / 100;
    }

    const details: LearnedPreferences['details'] = {};
    for (const [key, values] of detailTotals) {
      const keyTotal = detailKeyTotals.get(key) ?? 0;
      if (keyTotal < MIN_WEIGHTED_SAMPLES) continue;
      const [value, weight] = [...values.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
      const share = weight / keyTotal;
      if (value && share >= MIN_SHARE) details[key] = { value, share: Math.round(share * 100) / 100 };
    }

    if (Object.keys(cutTypes).length === 0 && Object.keys(details).length === 0) return null;
    return { sampleSize: rows.length, cutTypes, details };
  }
}
