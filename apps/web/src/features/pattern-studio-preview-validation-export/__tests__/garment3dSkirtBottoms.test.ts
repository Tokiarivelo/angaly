import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { JupeRule } from '../../../../../../packages/pattern-engine/src/rules/jupe.rule';
import { bodyLandmarks, buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment, type PanelMeshData } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { applyPose, forearmMask, POSE_PRESETS } from '../utils/garment3d/pose';
import { loadHumanBase } from './helpers/humanBase';

const human = loadHumanBase();
const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const body = readBodyMeasurements(M, 'FEMME_STANDARD');
const fitted = fitHumanBody(human, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
const positions = applyPose(fitted.positions, human.armWeights, body, POSE_PRESETS.PRESENTATION.pose);
const env = envelopeFromMesh(positions, human.indices, human.armWeights, body, forearmMask(fitted.positions, human.armWeights, body));
const l = bodyLandmarks(body);

const skirt = (cut: string, details: Record<string, string>): PanelMeshData[] => {
  const pieces = JupeRule.computePieces({ garmentType: 'JUPE', cutType: cut, style: null, details }, M).map(
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
  return drapeGarment(built.model.layout, body, env).filter((p) => p.zone === 'skirt');
};
const top = (panels: PanelMeshData[]): number => Math.max(...panels.flatMap((p) => Array.from(p.positions).filter((_, i) => i % 3 === 1)));
const bottom = (panels: PanelMeshData[]): number => Math.min(...panels.flatMap((p) => Array.from(p.positions).filter((_, i) => i % 3 === 1)));

describe('skirt construction on the human body', () => {
  it('sits a high-waisted skirt above the waist, a low-rise one below it', () => {
    const natural = top(skirt('EVASEE', { longueur: 'GENOU' }));
    expect(Math.abs(natural - l.waistY)).toBeLessThan(0.02);
    expect(top(skirt('EVASEE', { longueur: 'GENOU', taille: 'HAUTE' })) - natural).toBeGreaterThan(0.03);
    expect(natural - top(skirt('EVASEE', { longueur: 'GENOU', taille: 'BASSE' }))).toBeGreaterThan(0.03);
  });

  it('keeps the hem of a vented pencil skirt where the plain one is (the underlap is not draped)', () => {
    const vented = skirt('AJUSTEE', { longueur: 'MIDI' });
    const plain = skirt('AJUSTEE', { longueur: 'MIDI', fente: 'AUCUNE' });
    expect(vented.length).toBeGreaterThan(0);
    expect(Math.abs(bottom(vented) - bottom(plain))).toBeLessThan(0.01);
  });
});
