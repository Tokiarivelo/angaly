import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { buildGarmentModel } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const dress = (cutType: string, details: Record<string, string>, fullness?: { skirt: number }) => {
  const pieces = RobeRule.computePieces({ garmentType: 'ROBE', cutType, style: null, details, ...(fullness ? { fullness } : {}) }, M).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'ROBE', M, null, 'STRUCTURE');
  if (!built.ok) throw new Error(built.reason);
  return built.model.panels;
};

describe('fold shading (ambient occlusion of the cloth)', () => {
  it('leaves a fitted bodice unshaded: no godets in a bodice, no dark centre front', () => {
    // Before: the shading was normalised per row and fell darkest where the folds fade out (centre front, side seams),
    // and the bodice took godets across the midriff — a "six-pack" of dark grooves on every fitted bodice.
    for (const panel of dress('DROITE', { longueur: 'SOL' }).filter((p) => p.zone === 'bodice')) {
      expect(panel.ao).toBeDefined();
      expect(Math.min(...panel.ao!)).toBeGreaterThan(0.99);
    }
  });

  it('still shades the hollows of a flared skirt, in proportion to their depth', () => {
    const skirt = dress('PRINCESSE', { longueur: 'SOL' }, { skirt: 3.2 }).filter((p) => p.zone === 'skirt');
    const ao = skirt.flatMap((p) => Array.from(p.ao ?? []));
    expect(Math.min(...ao)).toBeLessThan(0.8);
    expect(Math.min(...ao)).toBeGreaterThanOrEqual(0.45 - 1e-6);
    // The centre front column (the first one of each row) is flat cloth: never in a hollow.
    const front = skirt.find((p) => p.id === 'skirt-front')!;
    const columns = 29;
    for (let r = 0; r < front.ao!.length / columns; r += 1) expect(front.ao![r * columns]!).toBeGreaterThan(0.99);
  });
});
