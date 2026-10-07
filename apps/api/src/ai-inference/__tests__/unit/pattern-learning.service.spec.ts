import type { PatternLearningRow } from '../../domain/repositories/pattern-learning.repository';
import { PatternLearningService } from '../../application/services/pattern-learning.service';

const row = (
  cutType: string,
  outcome: PatternLearningRow['outcome'] = 'GENERATED',
  extra: Partial<PatternLearningRow> = {},
): PatternLearningRow => ({ cutType, occasion: null, style: null, details: {}, outcome, ...extra });

describe('PatternLearningService.aggregate', () => {
  it('returns null while there is too little evidence', () => {
    expect(PatternLearningService.aggregate([row('EVASEE'), row('EVASEE')], {})).toBeNull();
  });

  it('reports the cut types that dominate past projects', () => {
    const rows = [
      ...Array.from({ length: 6 }, () => row('EVASEE')),
      ...Array.from({ length: 2 }, () => row('SIRENE')),
      row('DROITE'),
    ];
    const result = PatternLearningService.aggregate(rows, {});

    expect(result?.sampleSize).toBe(9);
    expect(result?.cutTypes.EVASEE).toBeCloseTo(0.67, 1);
    expect(result?.cutTypes.SIRENE).toBeUndefined(); // 22% < 30%
    expect(result?.cutTypes.DROITE).toBeUndefined(); // below the 30% share threshold
  });

  it('weights exported patterns more than merely generated ones', () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row('DROITE', 'GENERATED')),
      ...Array.from({ length: 3 }, () => row('SIRENE', 'EXPORTED')),
    ];
    const result = PatternLearningService.aggregate(rows, {});

    // SIRENE: 3×3 = 9 vs DROITE: 4 → SIRENE leads despite fewer projects.
    expect(result!.cutTypes.SIRENE!).toBeGreaterThan(result!.cutTypes.DROITE!);
  });

  it('gives extra weight to projects with the same style or occasion', () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row('DROITE', 'GENERATED', { style: 'Classique' })),
      ...Array.from({ length: 4 }, () => row('SIRENE', 'GENERATED', { style: 'Moderne' })),
    ];
    const result = PatternLearningService.aggregate(rows, { style: 'Moderne' });

    expect(result!.cutTypes.SIRENE!).toBeGreaterThan(result!.cutTypes.DROITE!);
  });

  it('keeps the most common value of each detail when it is shared enough', () => {
    const rows = [
      ...Array.from({ length: 5 }, () => row('EVASEE', 'GENERATED', { details: { encolure: 'bateau' } })),
      row('EVASEE', 'GENERATED', { details: { encolure: 'carre' } }),
    ];
    const result = PatternLearningService.aggregate(rows, {});

    expect(result?.details.encolure).toEqual({ value: 'bateau', share: 0.83 });
  });
});
