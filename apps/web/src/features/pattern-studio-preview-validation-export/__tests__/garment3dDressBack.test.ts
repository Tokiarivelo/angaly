import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, forearmMask, POSE_PRESETS } from '../utils/garment3d/pose';
import { loadHumanBase } from './helpers/humanBase';

const human = loadHumanBase();
const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const body = readBodyMeasurements(M, 'FEMME_STANDARD');
const fitted = fitHumanBody(human, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
const positions = applyPose(fitted.positions, human.armWeights, body, POSE_PRESETS.PRESENTATION.pose);
const env = envelopeFromMesh(positions, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));

/** Highest point of the back bodice at the centre back (m), for a dress with this back. */
const centreBackTop = (dos: string): number => {
  const pieces = RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'DROITE', style: null, details: { longueur: 'GENOU', manches: 'COURTES', dos } }, M).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'ROBE', M);
  if (!built.ok) throw new Error(built.reason);
  let top = -Infinity;
  for (const p of drapeGarment(built.model.layout, body, env)) {
    if (p.zone !== 'bodice' || p.role !== 'back') continue;
    for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(p.positions[i]!) < 0.015) top = Math.max(top, p.positions[i + 1]!);
  }
  return top;
};

describe('dress back on the human body', () => {
  it('opens the back: a V lower than the plain back, a bare back lower still', () => {
    const plain = centreBackTop('FERME');
    const v = centreBackTop('DECOLLETE_V');
    expect(plain - v).toBeGreaterThan(0.08);
    expect(v - centreBackTop('DOS_NU')).toBeGreaterThan(0.05);
  });
});
