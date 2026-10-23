import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeMarieeRule } from '../../../../../../packages/pattern-engine/src/rules/robe-mariee.rule';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment, skirtSurface } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, forearmMask, POSE_PRESETS, seatHandsOnSkirt } from '../utils/garment3d/pose';
import { loadHumanBase } from './helpers/humanBase';

// The reference ball gown (project 207c1614, Met 108161): a crinoline dome, fullness 3, 40 knife pleats of 80 mm.
const M = { STATURE: 165, TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42, LONGUEUR_BRAS: 59 };
const pieces = RobeMarieeRule.computePieces(
  {
    garmentType: 'ROBE_MARIEE',
    cutType: 'PRINCESSE',
    style: null,
    details: { manches: 'COURTES', longueur: 'SOL', decollete: 'HORS_EPAULES' },
    fullness: { skirt: 3, sleeve: 1.75 },
    lengths: { sleevePct: 20 },
    drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 40, depthMm: 80, type: 'KNIFE' }] },
  },
  M,
).map(
  (p, i) =>
    ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
);
const base = loadHumanBase();
const built = buildGarmentModel(pieces, 'ROBE_MARIEE', M, 'FEMME_STANDARD');
if (!built.ok) throw new Error(built.reason);
const { body, torsoRings, layout } = built.model;
const fitted = fitHumanBody(base, body, torsoRings, morphFor(body, 'FEMME_STANDARD'));
const forearm = forearmMask(fitted.positions, base.armWeights, body);
const restEnv = envelopeFromMesh(fitted.positions, base.indices, base.armWeights, body, forearm);
const surface = skirtSurface(drapeGarment(layout, body, restEnv), restEnv.axisZ);

/** Deepest point (m) of a hand inside the skirt's surface (≤ 0: the hand lies on or outside the cloth). */
const handDepth = (posed: Float32Array): number => {
  let depth = -Infinity;
  for (let i = 0; i < base.armWeights.length; i += 1) {
    // Hands: firmly weighted arm vertices below the hips.
    if (base.armWeights[i]! < 0.9 || posed[i * 3 + 1]! > 0.95) continue;
    const x = posed[i * 3]!;
    const z = posed[i * 3 + 2]! - restEnv.axisZ;
    const r = surface(posed[i * 3 + 1]!, Math.atan2(x, z));
    if (r !== null) depth = Math.max(depth, r - Math.hypot(x, z));
  }
  return depth;
};

describe('hands resting on a crinoline', () => {
  const pose = POSE_PRESETS.PRESENTATION.pose;

  it('the fashion-plate pose puts the hands through the dome (the reported bug)', () => {
    expect(handDepth(applyPose(fitted.positions, base.armWeights, body, pose))).toBeGreaterThan(0.03);
  });

  it('moves the arms out until the hands lie on the skirt, keeping the other joints', () => {
    const seated = seatHandsOnSkirt(pose, fitted.positions, base.armWeights, body, surface, restEnv.axisZ);
    expect(handDepth(applyPose(fitted.positions, base.armWeights, body, seated))).toBeLessThan(0.015);
    for (const limb of ['leftArm', 'rightArm'] as const) {
      expect(seated[limb].raise).toBeGreaterThan(pose[limb].raise);
      expect(seated[limb].raise).toBeLessThanOrEqual(60);
      expect(seated[limb].bend).toBe(pose[limb].bend);
    }
    expect(seated.leftLeg).toEqual(pose.leftLeg);
  });

  it('leaves the arms alone where there is no skirt to rest on', () => {
    expect(seatHandsOnSkirt(pose, fitted.positions, base.armWeights, body, () => null, restEnv.axisZ)).toEqual(pose);
  });
});
