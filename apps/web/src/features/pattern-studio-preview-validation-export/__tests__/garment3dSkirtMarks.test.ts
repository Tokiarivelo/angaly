import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { JupeRule } from '../../../../../../packages/pattern-engine/src/rules/jupe.rule';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };

/** Line segments drawn on the skirt's front cloth for these details. */
const frontMarks = (details: Record<string, string>): number[] => {
  const pieces = JupeRule.computePieces({ garmentType: 'JUPE', cutType: 'DROITE', style: null, details: { longueur: 'GENOU', ...details } }, M).map(
    (p, i) =>
      ({
        id: `p${i}`,
        versionId: 'v',
        name: p.name,
        dimensionsJson: { outlineMm: p.outlineMm, ...(p.internalLinesMm ? { internalLinesMm: p.internalLinesMm } : {}) },
        fabricRecommendation: null,
        quantity: p.quantity,
        grainlineJson: null,
        seamAllowanceCm: 1,
        notchesJson: [],
      }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'JUPE', M);
  if (!built.ok) throw new Error(built.reason);
  const front = built.model.panels.find((p) => p.zone === 'skirt' && (p.label ?? '').toLowerCase().includes('devant'));
  if (!front) throw new Error('no front');
  return Array.from(front.border);
};

describe('the skirt shows on the 3D cloth what its pattern marks', () => {
  it('draws the patch pockets and the slanted pocket openings, following the cloth round the hips', () => {
    const plain = frontMarks({ poches: 'AUCUNE' }).length;
    expect(frontMarks({ poches: 'PLAQUEES' }).length).toBeGreaterThan(plain + 6 * 8);
    expect(frontMarks({ poches: 'ITALIENNES' }).length).toBeGreaterThan(plain + 6 * 4);
  });

  it('keeps every mark on the cloth: none inside the body axis', () => {
    const border = frontMarks({ poches: 'PLAQUEES' });
    for (let i = 0; i < border.length; i += 3) expect(Math.hypot(border[i]!, border[i + 2]!)).toBeGreaterThan(0.05);
  });
});
