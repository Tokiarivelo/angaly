import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { buildTorsoRings, readBodyMeasurements } from '../utils/garment3d/body-model';
import { envelopeFromMesh } from '../utils/garment3d/body-envelope';
import { buildGarmentModel, drapeGarment } from '../utils/garment3d/garment-model';
import { fitHumanBody, morphFor } from '../utils/garment3d/human-body';
import { buildHair, findFaceLandmarks } from '../utils/garment3d/head-features';
import { loadHumanBase } from './helpers/humanBase';

const human = loadHumanBase();
const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const body = readBodyMeasurements(M, 'FEMME_STANDARD');
const result = fitHumanBody(human, body, buildTorsoRings(body), morphFor(body, 'FEMME_STANDARD'));
const piece = (id: string, name: string, pts: Array<[number, number]>, quantity = 1): PatternPieceDto =>
  ({ id, versionId: 'v', name, dimensionsJson: { outlineMm: [...pts, pts[0]!].map(([x, y]) => ({ x, y })) }, fabricRecommendation: null, quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto;

/** Skin points of the neck (|x| < 7 cm) between two heights. */
const neckSkin = (y0: number, y1: number): Array<[number, number, number]> => {
  const out: Array<[number, number, number]> = [];
  const p = result.positions;
  for (let i = 0; i < p.length; i += 3) if (p[i + 1]! >= y0 && p[i + 1]! <= y1 && Math.abs(p[i]!) < 0.07) out.push([p[i]!, p[i + 1]!, p[i + 2]!]);
  return out;
};

describe('band collar on the real body', () => {
  const built = buildGarmentModel(
    [
      piece('cd', 'Corsage Devant', [[0, 0], [60, 0], [240, 50], [240, 242], [195, 440], [0, 440]]),
      piece('cdos', 'Corsage Dos', [[0, 0], [75, 0], [210, 45], [210, 220], [165, 400], [0, 400]], 2),
      piece('col', 'Col officier', [[0, 0], [380, 0], [370, 45], [10, 45]], 2),
    ],
    'ROBE',
    M,
  );
  if (!built.ok) throw new Error(built.reason);
  const env = envelopeFromMesh(result.positions, human.indices, human.armWeights, body);
  const dressed = drapeGarment(built.model.layout, body, env);
  const collar = dressed.find((p) => p.zone === 'collar')!;
  const bodiceCloth = dressed.filter((p) => p.zone === 'bodice').flatMap((p) => Array.from({ length: p.positions.length / 3 }, (_, i) => [p.positions[i * 3]!, p.positions[i * 3 + 1]!, p.positions[i * 3 + 2]!]));
  /** The foot of the band, sewn onto the bodice's neck edge all round: it lies on that cloth, off the neck. */
  const onBodice = (x: number, y: number, z: number): boolean => bodiceCloth.some((q) => Math.hypot(q[0]! - x, q[1]! - y, q[2]! - z) < 0.012);

  it('closes round the neck itself: never more than ~2 cm off the skin, front and back, and never inside it', () => {
    const ys = Array.from(collar.positions).filter((_, i) => i % 3 === 1);
    const skin = neckSkin(Math.min(...ys), Math.max(...ys));
    expect(skin.length).toBeGreaterThan(20);
    for (let i = 0; i < collar.positions.length; i += 3) {
      const x = collar.positions[i]!;
      const y = collar.positions[i + 1]!;
      const z = collar.positions[i + 2]!;
      // Behind the nape the band's lowest part flares onto the trapezius, and all round its foot runs down to the
      // bodice's neckline (garment3dVictorianBody): only the band above hugs the neck.
      if (z < env.axisZ && y < body.napeY + 0.022) continue;
      if (onBodice(x, y, z)) continue;
      // Nearest skin point at about the same height.
      let best = Infinity;
      for (const s of skin) if (Math.abs(s[1] - y) < 0.01) best = Math.min(best, Math.hypot(s[0] - x, s[2] - z));
      if (Number.isFinite(best)) expect(best).toBeLessThan(0.022);
    }
    // It goes round the nape (behind the neck, outside the skin there), not only round the throat.
    let checked = 0;
    for (let i = 0; i < collar.positions.length; i += 3) {
      const x = collar.positions[i]!;
      const y = collar.positions[i + 1]!;
      const z = collar.positions[i + 2]!;
      if (Math.abs(x) > 0.008 || z > 0.02) continue;
      const back = skin.filter((p) => Math.abs(p[1] - y) < 0.006 && Math.abs(p[0]) < 0.02).map((p) => p[2]);
      if (back.length === 0) continue;
      expect(z).toBeLessThan(Math.min(...back) + 0.003);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('chignon', () => {
  it('covers the side of the head from the temple to behind the ear (no bare patch over the ear)', () => {
    const f = findFaceLandmarks(result.positions, human.armWeights, body, human.indices)!;
    const hair = buildHair(result.positions, human.armWeights, body, f, 'bun');
    const C = f.skull;
    // Directions round the head (0 = front) where the hair must come down to just above eye level.
    for (const deg of [60, 85, 100, 115]) {
      let lowest = Infinity;
      for (let i = 0; i < hair.positions.length; i += 3) {
        if (hair.alpha[i / 3]! < 0.5) continue;
        const a = (Math.abs(Math.atan2(hair.positions[i]! - C.x, hair.positions[i + 2]! - C.z)) * 180) / Math.PI;
        if (Math.abs(a - deg) < 6) lowest = Math.min(lowest, hair.positions[i + 1]!);
      }
      expect(lowest).toBeLessThan(f.eye.y + 0.03);
    }
  });
});
