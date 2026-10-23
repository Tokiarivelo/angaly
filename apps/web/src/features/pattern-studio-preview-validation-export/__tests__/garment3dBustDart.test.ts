import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { forearmMask } from '../utils/garment3d/pose';
import { loadHumanBase } from './helpers/humanBase';

const human = loadHumanBase();
const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const body = readBodyMeasurements(M, 'FEMME_STANDARD');
const fitted = fitHumanBody(human, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
const env = envelopeFromMesh(fitted.positions, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));

/** The draped front bodice of a robe made for these measurements: its lowest and highest points, its width. */
const frontBodice = (m: Record<string, number>) => {
  const pieces = RobeRule.computePieces(
    { garmentType: 'ROBE', cutType: 'EVASEE', style: null, details: { manches: 'COURTES', decollete: 'MOYEN', longueur: 'GENOU' } },
    m,
  ).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'ROBE', m, null, 'FLUIDE');
  if (!built.ok) throw new Error(built.reason);
  const panel = drapeGarment(built.model.layout, body, env, {}).find((p) => p.zone === 'bodice' && p.role === 'front')!;
  const ys: number[] = [];
  const xs: number[] = [];
  for (let i = 0; i < panel.positions.length; i += 3) {
    xs.push(panel.positions[i]!);
    ys.push(panel.positions[i + 1]!);
  }
  return { bottom: Math.min(...ys), top: Math.max(...ys), width: Math.max(...xs) - Math.min(...xs) };
};

describe('bust dart in 3D', () => {
  it('drapes a bodice cut with a bust dart like one without: the dart is sewn, the waist stays at the waist', () => {
    const plain = frontBodice(M);
    // 92 − 87 = 5 cm of cup: a 30 mm dart on the side seam.
    const darted = frontBodice({ ...M, TOUR_HAUT_POITRINE: 87 });
    expect(Math.abs(darted.bottom - plain.bottom)).toBeLessThan(0.015);
    expect(Math.abs(darted.top - plain.top)).toBeLessThan(0.015);
    expect(Math.abs(darted.width - plain.width)).toBeLessThan(0.02);
  });
});
