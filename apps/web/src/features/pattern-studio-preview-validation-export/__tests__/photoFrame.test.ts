import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeMarieeRule } from '../../../../../../packages/pattern-engine/src/rules/robe-mariee.rule';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import {
  coverageOf,
  FRONT_VISIBLE_SHARE,
  garmentMask,
  maskRect,
  pieceAt,
  projectGarment,
  toPhoto,
  type GarmentMask,
} from '../utils/garment3d/photo-frame';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
// The 1850s ball gown: pointed boned bodice, skirt in gathered gores with a train, petticoat.
const pieces = RobeMarieeRule.computePieces(
  {
    garmentType: 'ROBE_MARIEE',
    cutType: 'PRINCESSE',
    style: null,
    ease: 'AJUSTE',
    fullness: { skirt: 3, sleeve: 1.75 },
    lengths: { sleevePct: 20 },
    details: { decollete: 'HORS_EPAULES', taille: 'POINTE', corsage: 'BALEINE', manches: 'COURTES', longueur: 'SOL', jupe: 'EN_LES' },
  },
  M,
).map(
  (p, i) =>
    ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
);
const built = buildGarmentModel(pieces, 'ROBE_MARIEE', M);
if (!built.ok) throw new Error(built.reason);
const projection = projectGarment(built.model.panels)!;
const idOf = (prefix: string) => pieces.find((p) => p.name.startsWith(prefix))!.id;

describe('projectGarment — the draped pieces seen from the front', () => {
  it('frames the whole garment, from the neckline down to the floor', () => {
    const { frame } = projection;
    expect(frame.top).toBeGreaterThan(1.2);
    expect(frame.bottom).toBeLessThan(0.05);
    expect(frame.maxX - frame.minX).toBeGreaterThan(0.6);
  });

  it('sees the front pieces from the front and the back pieces from behind', () => {
    const front = projection.pieces.get(idOf('Bustier Devant'))!;
    const back = projection.pieces.get(idOf('Bustier Dos'))!;
    expect(front.frontShare).toBeGreaterThan(0.8);
    expect(back.frontShare).toBeLessThan(FRONT_VISIBLE_SHARE);
  });

  it('keeps each gore of a joined skirt panel apart: a click lands on the gore it is cut for', () => {
    for (const name of ['Jupe Devant', 'Jupe Côté Devant', 'Jupe Côté (']) expect(projection.pieces.get(idOf(name))?.front.length).toBeGreaterThan(0);
    // Centre front, half-way down the skirt: the centre front gore.
    expect(pieceAt(projection, 0.5, 0.6)).toBe(idOf('Jupe Devant'));
    // Centre front of the bodice.
    expect(pieceAt(projection, 0.5, 0.2)).toBe(idOf('Bustier Devant'));
  });

  it('lists nothing for the pieces sewn inside (waist stay, boning channels)', () => {
    expect(projection.pieces.has(idOf('Ceinture intérieure'))).toBe(false);
  });
});

/** A synthetic photo: grey background, a white mannequin neck, a golden dress (a trapezoid). */
const photo = (w: number, h: number) => {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      let c = [200, 200, 198];
      if (y < 20 && Math.abs(x - w / 2) < 6) c = [245, 245, 243];
      const half = 10 + ((y - 20) / (h - 30)) * (w / 2 - 12);
      if (y >= 20 && y < h - 10 && Math.abs(x - w / 2) < half) c = y > h / 2 && x < w / 2 ? [150, 130, 88] : [216, 197, 151];
      rgba.set([c[0]!, c[1]!, c[2]!, 255], i);
    }
  }
  return rgba;
};

describe('garmentMask / maskRect — the garment on the photo', () => {
  const rgba = photo(100, 120);

  it('finds the dress by its fabric colour, shadows included, leaving the white mannequin out', () => {
    const mask = garmentMask(rgba, 100, 120, '#d8c597')!;
    const rect = maskRect(mask)!;
    expect(rect.y0).toBeCloseTo(20 / 120, 2);
    expect(rect.y1).toBeCloseTo(110 / 120, 2);
    expect(rect.x0).toBeLessThan(0.05);
  });

  it('falls back on what differs from the background when the colour is unknown', () => {
    const rect = maskRect(garmentMask(rgba, 100, 120, null)!)!;
    // The mannequin's neck is part of the subject then.
    expect(rect.y0).toBeLessThan(0.02);
  });

  it('returns null for a blank photo', () => {
    expect(garmentMask(new Uint8ClampedArray(40 * 40 * 4).fill(200), 40, 40, '#d8c597')).toBeNull();
  });
});

describe('coverageOf — parts of the model no piece covers', () => {
  it('covers a garment drawn exactly as the projection, and flags a part the pattern misses', () => {
    const w = 60;
    const h = 90;
    const cells = new Uint8Array(w * h);
    const rect = { x0: 0.1, y0: 0.05, x1: 0.9, y1: 0.95 };
    // The garment = where the front pieces fall on the photo …
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1) {
        const u = ((x + 0.5) / w - rect.x0) / (rect.x1 - rect.x0);
        const v = ((y + 0.5) / h - rect.y0) / (rect.y1 - rect.y0);
        if (pieceAt(projection, u, v)) cells[y * w + x] = 1;
      }
    const mask: GarmentMask = { width: w, height: h, cells };
    expect(coverageOf(projection, rect, mask).covered).toBeGreaterThan(0.99);
    // … plus a strip below the hem that no piece reaches (a flounce not in the pattern).
    const [, hemY] = toPhoto(rect, 0.5, 1);
    for (let y = Math.ceil(hemY * h); y < h; y += 1) for (let x = 20; x < 40; x += 1) cells[y * w + x] = 1;
    const coverage = coverageOf(projection, rect, mask);
    expect(coverage.covered).toBeLessThan(0.99);
    expect(coverage.missing[(h - 1) * w + 30]).toBe(1);
  });
});
