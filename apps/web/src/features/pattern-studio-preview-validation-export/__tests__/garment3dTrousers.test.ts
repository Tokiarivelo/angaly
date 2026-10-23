import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { PantalonRule } from '../../../../../../packages/pattern-engine/src/rules/pantalon.rule';
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
const kneeY = (l.crotchY + l.ankleY) / 2;

const piecesOf = (cut: string, details: Record<string, string> = { longueur: 'SOL' }): PatternPieceDto[] =>
  PantalonRule.computePieces({ garmentType: 'PANTALON', cutType: cut, style: null, details }, M).map(
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

/** The two legs of trousers in this cut, floor length, draped on the posed human body. */
const legs = (cut: string, details?: Record<string, string>): PanelMeshData[] => {
  const built = buildGarmentModel(piecesOf(cut, details), 'PANTALON', M);
  if (!built.ok) throw new Error(built.reason);
  return drapeGarment(built.model.layout, body, env).filter((p) => p.zone === 'legs');
};

/** Width (m, seen from the front) of the left leg (+x) in a 4 cm band about height y. */
const widthAt = (panels: PanelMeshData[], y: number): number => {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const p of panels) {
    for (let i = 0; i < p.positions.length; i += 3) {
      const x = p.positions[i]!;
      if (x <= 0 || Math.abs(p.positions[i + 1]! - y) > 0.02) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
  }
  return x1 - x0;
};

describe('trousers draped on the human body', () => {
  const bell = legs('SIRENE');
  const straight = legs('DROITE');

  it('flares bell-bottoms out from the knee: the hem is far wider than the knee', () => {
    const knee = widthAt(bell, kneeY);
    const hem = widthAt(bell, l.ankleY + 0.02);
    expect(hem / knee).toBeGreaterThan(1.35);
    expect(hem).toBeGreaterThan(widthAt(straight, l.ankleY + 0.02) * 1.2);
  });

  it('keeps a straight leg about as wide at the hem as at the knee', () => {
    const ratio = widthAt(straight, l.ankleY + 0.02) / widthAt(straight, kneeY);
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.15);
  });

  it('never lets the legs cross once the thighs part, nor the hem go through the floor', () => {
    // Where the thighs touch (just under the crotch) the two legs' cloth meets past the middle, as it is pressed.
    for (const panels of [bell, straight, legs('PRINCESSE')]) {
      for (const p of panels) {
        for (let i = 0; i < p.positions.length; i += 3) {
          const y = p.positions[i + 1]!;
          expect(y).toBeGreaterThan(0);
          if (y < kneeY) expect(Math.abs(p.positions[i]!)).toBeGreaterThan(0.003);
        }
      }
    }
  });

  it('puts a high waist above the natural waist and a low one below it', () => {
    const topOf = (details: Record<string, string>): number => Math.max(...legs('DROITE', details).flatMap((p) => Array.from(p.positions).filter((_, i) => i % 3 === 1)));
    const natural = topOf({});
    expect(topOf({ taille: 'HAUTE' }) - natural).toBeGreaterThan(0.03);
    expect(natural - topOf({ taille: 'BASSE' })).toBeGreaterThan(0.03);
  });

  it('draws on the cloth what the pattern marks: the fly on one front, the pockets, the welts and the turn-up', () => {
    const lineCount = (details: Record<string, string>): { left: number; right: number; hem: number } => {
      const panels = legs('DROITE', { longueur: 'MAXI', ...details });
      let left = 0;
      let right = 0;
      let hem = 0;
      for (const p of panels) {
        for (let i = 0; i < p.border.length; i += 6) {
          const x = (p.border[i]! + p.border[i + 3]!) / 2;
          const y = (p.border[i + 1]! + p.border[i + 4]!) / 2;
          // Near the centre front, between the waist and the crotch: the fly.
          if (Math.abs(x) < 0.06 && y > l.crotchY + 0.02 && y < l.waistY) {
            if (x > 0) left += 1;
            else right += 1;
          }
          if (y < l.ankleY + 0.1 && y > 0.02) hem += 1;
        }
      }
      return { left, right, hem };
    };
    const plain = lineCount({ fermeture: 'ELASTIQUE', poches: 'AUCUNE' });
    const fly = lineCount({ fermeture: 'BRAGUETTE_ZIP', poches: 'AUCUNE' });
    expect(fly.left - plain.left).toBeGreaterThan(3);
    // The fly is on the left front only.
    expect(fly.right - plain.right).toBeLessThanOrEqual(1);
    // Patch pockets and the turn-up add their outlines.
    const patch = lineCount({ fermeture: 'ELASTIQUE', poches: 'PLAQUEES' });
    expect(patch.left + patch.right).toBeGreaterThan(plain.left + plain.right);
    expect(lineCount({ fermeture: 'ELASTIQUE', poches: 'AUCUNE', bas: 'REVERS' }).hem).toBeGreaterThan(plain.hem);
  });

  it('lays the fly, pockets and turn-up as pieces of their own, and draws no belt without a waistband', () => {
    const built = buildGarmentModel(piecesOf('DROITE', { poches: 'PLAQUEES', poches_dos: 'PASSEPOIL', bas: 'REVERS' }), 'PANTALON', M);
    if (!built.ok) throw new Error(built.reason);
    const panels = drapeGarment(built.model.layout, body, env);
    expect(panels.filter((p) => p.zone === 'legs')).toHaveLength(4);
    expect(panels.some((p) => p.zone === 'belt')).toBe(true);
    // The legs are only the trouser pieces; each detail is a panel named after its own pieces.
    const legLabels = panels.filter((p) => p.zone === 'legs').map((p) => p.label.toLowerCase()).join(' | ');
    for (const name of ['braguette', 'poche', 'revers', 'passepoil']) expect(legLabels).not.toContain(name);
    const detailLabels = panels.filter((p) => p.zone === 'detail').map((p) => p.label.toLowerCase()).join(' | ');
    for (const name of ['braguette', 'poche plaquée', 'revers', 'passepoil']) expect(detailLabels).toContain(name);
    const bare = buildGarmentModel(piecesOf('DROITE', { ceinture: 'SANS' }), 'PANTALON', M);
    if (!bare.ok) throw new Error(bare.reason);
    expect(drapeGarment(bare.model.layout, body, env).some((p) => p.zone === 'belt')).toBe(false);
  });

  it('lets wide trousers fall straight from the hips: no bulge above the crotch', () => {
    const reach = (panels: PanelMeshData[], y: number): number => {
      let m = 0;
      for (const p of panels) for (let i = 0; i < p.positions.length; i += 3) if (Math.abs(p.positions[i + 1]! - y) < 0.012) m = Math.max(m, Math.abs(p.positions[i]!));
      return m;
    };
    // A straight leg may follow the thigh in (the body narrows ~7 % there); the wide cuts must not.
    for (const cut of ['OVERSIZE', 'PRINCESSE']) {
      const panels = legs(cut, { longueur: 'MAXI' });
      const above = reach(panels, l.crotchY + 0.03);
      const below = reach(panels, l.crotchY - 0.06);
      expect(above / below, cut).toBeLessThan(1.06);
    }
  });
});
