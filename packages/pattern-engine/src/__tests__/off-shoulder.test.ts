import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { resolveNecklineChoice } from '../shared/cut-profile';
import { OFF_SHOULDER_SUFFIX, offShoulderNeckline, offShoulderSleeve } from '../shared/shapes';
import { hasSelfIntersection } from '../shared/geometry-checks';
import type { MeasurementSet, PatternParameters, PatternPieceGeometry } from '../types';

const M: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const params = (garmentType: 'ROBE' | 'ROBE_MARIEE', details: Record<string, string>): PatternParameters => ({
  garmentType,
  cutType: 'PRINCESSE',
  style: null,
  details: { longueur: 'SOL', ...details },
});
const gen = (garmentType: 'ROBE' | 'ROBE_MARIEE', details: Record<string, string>) =>
  (garmentType === 'ROBE' ? RobeRule : RobeMarieeRule).computePieces(params(garmentType, details), M);
const piece = (pieces: PatternPieceGeometry[], start: string) => pieces.find((p) => p.name.startsWith(start))!;
const closed = (o: Array<{ x: number; y: number }>) => o[0]!.x === o[o.length - 1]!.x && o[0]!.y === o[o.length - 1]!.y;
/** Top edge of a bodice piece: its y at x (the highest outline crossing). */
const topAt = (o: Array<{ x: number; y: number }>, x: number): number => {
  let best = Infinity;
  for (let i = 1; i < o.length; i += 1) {
    const a = o[i - 1]!;
    const b = o[i]!;
    if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) best = Math.min(best, a.y + ((x - a.x) * (b.y - a.y)) / (b.x - a.x));
  }
  return best;
};

describe('off-the-shoulder neckline (decollete HORS_EPAULES)', () => {
  it('is its own shape, deeper than a boat neck, and wins over col BATEAU', () => {
    const n = resolveNecklineChoice({ decollete: 'HORS_EPAULES', col: 'BATEAU' })!;
    expect(n.shape).toBe('OFF_SHOULDER');
    expect(n.depthMm).toBeGreaterThan(resolveNecklineChoice({ decollete: 'MOYEN' })!.depthMm);
    expect(n.armDropMm).toBeGreaterThan(30);
  });

  it('robe: one edge from the centre front to the armhole, below the shoulder point all the way', () => {
    const plain = gen('ROBE', { manches: 'COURTES', col: 'BATEAU' });
    const off = gen('ROBE', { manches: 'COURTES', decollete: 'HORS_EPAULES' });
    for (const name of ['Corsage Devant', 'Corsage Dos']) {
      const before = piece(plain, name).outlineMm;
      const after = piece(off, name);
      expect(after.name).toBe(name + OFF_SHOULDER_SUFFIX);
      const o = after.outlineMm;
      expect(closed(o)).toBe(true);
      expect(hasSelfIntersection(o)).toBe(false);
      // The plain bodice's shoulder point (armhole tip) and its height.
      const tip = before.filter((p) => p.y < 150).reduce((a, b) => (b.x > a.x ? b : a));
      const width = Math.max(...o.map((p) => p.x));
      for (let x = 0; x <= width; x += 10) expect(topAt(o, x)).toBeGreaterThan(tip.y);
      // At the armhole: well below the shoulder point (on the arm), still above the underarm.
      expect(topAt(o, width - 1)).toBeGreaterThanOrEqual(tip.y + 40);
    }
    // Centre front 13 cm below the shoulder line.
    expect(piece(off, 'Corsage Devant').outlineMm[0]).toEqual({ x: 0, y: 130 });
  });

  it('wedding dress: the bustier front, side and back share one edge below the shoulder line', () => {
    const off = gen('ROBE_MARIEE', { manches: 'COURTES', decollete: 'HORS_EPAULES' });
    const front = piece(off, 'Bustier Devant').outlineMm;
    const side = piece(off, 'Bustier Côté').outlineMm;
    const back = piece(off, 'Bustier Dos').outlineMm;
    for (const o of [front, side, back]) {
      expect(closed(o)).toBe(true);
      expect(hasSelfIntersection(o)).toBe(false);
      expect(Math.min(...o.map((p) => p.y))).toBeGreaterThanOrEqual(60);
    }
    // The side panel carries on the front's edge at their seam.
    const frontWidth = Math.max(...front.filter((p) => p.y < 200).map((p) => p.x));
    expect(topAt(side, 0)).toBe(topAt(front, frontWidth));
    expect(front[0]).toEqual({ x: 0, y: 110 });
  });

  it('cuts the sleeve cap under the edge, so the sleeve top runs on round the arm', () => {
    for (const garment of ['ROBE', 'ROBE_MARIEE'] as const) {
      const plain = piece(gen(garment, { manches: 'COURTES' }), 'Manche').outlineMm;
      const off = piece(gen(garment, { manches: 'COURTES', decollete: 'HORS_EPAULES' }), 'Manche');
      expect(off.name).toBe('Manche' + OFF_SHOULDER_SUFFIX);
      const height = (o: Array<{ y: number }>) => Math.max(...o.map((p) => p.y)) - Math.min(...o.map((p) => p.y));
      expect(height(plain) - height(off.outlineMm)).toBe(50);
      expect(closed(off.outlineMm)).toBe(true);
      expect(hasSelfIntersection(off.outlineMm)).toBe(false);
    }
  });

  it('drops the collar piece (no neckline to stand on) and changes nothing when not chosen', () => {
    expect(gen('ROBE', { decollete: 'HORS_EPAULES', col: 'CHALE' }).some((p) => /^col/i.test(p.name))).toBe(false);
    for (const garment of ['ROBE', 'ROBE_MARIEE'] as const) {
      const a = gen(garment, { manches: 'COURTES', col: 'BATEAU' });
      expect(a.some((p) => p.name.includes(OFF_SHOULDER_SUFFIX))).toBe(false);
    }
  });

  it('pure helpers: untouched input, armhole kept above the underarm, degenerate outlines copied', () => {
    const block = [
      { x: 0, y: 80 },
      { x: 80, y: 0 },
      { x: 200, y: 50 },
      { x: 210, y: 120 },
      { x: 180, y: 400 },
      { x: 0, y: 400 },
      { x: 0, y: 80 },
    ];
    const copy = block.map((p) => ({ ...p }));
    const out = offShoulderNeckline(block, 2, 100, 50);
    expect(block).toEqual(copy);
    // 50 + 50 = 100 would leave 20 mm of armhole: kept 60 mm above the underarm.
    expect(out.find((p) => p.x === 200)!.y).toBe(60);
    expect(offShoulderNeckline([{ x: 5, y: 0 }, { x: 1, y: 1 }], 2, 100, 50)).toEqual([{ x: 5, y: 0 }, { x: 1, y: 1 }]);
    const tiny = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 0, y: 0 }];
    expect(offShoulderSleeve(tiny, 50)).toEqual(tiny);
  });
});
