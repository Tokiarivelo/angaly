import { describe, expect, it } from 'vitest';
import { sleevePiece } from '../../../../../../packages/pattern-engine/src/shared/shapes';
import { buildGarmentModel } from '../utils/garment3d/garment-model';
import type { PatternPieceDto } from '@angaly/types';

type Outline = Array<{ x: number; y: number }>;
const closed = (pts: Array<[number, number]>): Outline => [...pts, pts[0]!].map(([x, y]) => ({ x, y }));
const piece = (id: string, name: string, outlineMm: Outline, quantity = 1): PatternPieceDto =>
  ({ id, versionId: 'v', name, dimensionsJson: { outlineMm }, fabricRecommendation: null, quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto;

const MEASUREMENTS = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };

/** Widest extent (m) of each sampled row of the draped sleeve, from the top of the shoulder to the cuff. */
const rowWidths = (outline: Outline): number[] => {
  const built = buildGarmentModel(
    [
      piece('cd', 'Corsage Devant', closed([[0, 0], [80, 0], [240, 50], [240, 242], [195, 440], [0, 440]])),
      piece('cdos', 'Corsage Dos', closed([[0, 0], [75, 0], [210, 45], [210, 220], [165, 400], [0, 400]]), 2),
      piece('m', 'Manche', outline, 2),
    ],
    'ROBE',
    MEASUREMENTS,
  );
  if (!built.ok) throw new Error('model not built');
  const sleeve = built.model.panels.find((p) => p.zone === 'sleeve')!;
  const rows = 48;
  const perRow = sleeve.positions.length / 3 / (rows + 1);
  const widths: number[] = [];
  for (let r = 0; r <= rows; r += 4) {
    const lo = [Infinity, Infinity];
    const hi = [-Infinity, -Infinity];
    for (let j = 0; j < perRow; j += 1) {
      [0, 2].forEach((axis, i) => {
        const v = sleeve.positions[(r * perRow + j) * 3 + axis]!;
        lo[i] = Math.min(lo[i]!, v);
        hi[i] = Math.max(hi[i]!, v);
      });
    }
    widths.push(Math.max(hi[0]! - lo[0]!, hi[1]! - lo[1]!));
  }
  return widths;
};

describe('3D puffed (gigot) sleeve', () => {
  const widths = rowWidths(sleevePiece('Manche', 920, { lengthMm: 480, cuffRatio: 0.7, topRatio: 1.9 }).outlineMm);

  it('is a round volume, not a flat blade: wide on the upper arm', () => {
    expect(Math.max(...widths)).toBeGreaterThan(0.15);
  });

  it('keeps its volume down to mid-length and is gathered at the cuff', () => {
    const mid = widths[Math.floor(widths.length / 2)]!;
    expect(mid).toBeGreaterThan(widths[widths.length - 1]! * 1.5);
    expect(widths[widths.length - 1]!).toBeLessThan(Math.max(...widths) / 2);
  });
});

describe('3D puffed sleeve head', () => {
  it('has no point where the cap is pushed off the bodice by the armpit', () => {
    const built = buildGarmentModel(
      [
        piece('cd', 'Corsage Devant', closed([[0, 0], [80, 0], [240, 50], [240, 242], [195, 440], [0, 440]])),
        piece('cdos', 'Corsage Dos', closed([[0, 0], [75, 0], [210, 45], [210, 220], [165, 400], [0, 400]]), 2),
        piece('m', 'Manche', sleevePiece('Manche', 920, { lengthMm: 200, cuffRatio: 0.9, topRatio: 1.6 }).outlineMm, 2),
      ],
      'ROBE',
      MEASUREMENTS,
    );
    if (!built.ok) throw new Error('model not built');
    const sleeve = built.model.panels.find((p) => p.zone === 'sleeve')!;
    const perRow = sleeve.positions.length / 3 / 49;
    const at = (r: number, j: number): number[] => [0, 1, 2].map((k) => sleeve.positions[(r * perRow + ((j + perRow) % perRow)) * 3 + k]!);
    for (const r of [0, 3, 6]) {
      for (let j = 0; j < perRow; j += 1) {
        const [a, b, c] = [at(r, j - 1), at(r, j), at(r, j + 1)];
        // How far a vertex stands off the line between its neighbours round the head: a point was 10–12 mm.
        expect(Math.hypot(...[0, 1, 2].map((k) => b[k]! - (a[k]! + c[k]!) / 2))).toBeLessThan(0.006);
      }
    }
  });
});
