import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { beltRadius, buildGarmentModel } from '../utils/garment3d/garment-model';
import { drapeCuff } from '../utils/garment3d/collar-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const model = (details: Record<string, string>) => {
  const pieces = RobeRule.computePieces(
    { garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', ...details }, lengths: { sleevePct: 100 }, fullness: { sleeve: 2.5 } },
    M,
  ).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'ROBE', M);
  if (!built.ok) throw new Error('model not built');
  return built.model;
};
const range = (positions: Float32Array, k: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = k; i < positions.length; i += 3) {
    lo = Math.min(lo, positions[i]!);
    hi = Math.max(hi, positions[i]!);
  }
  return [lo, hi];
};

describe('3D trims of a Victorian coat-dress (belt and bow, cuffs, facings)', () => {
  const coat = model({ devant: 'MANTEAU_OUVERT', col: 'OFFICIER', manches: 'BALLON', fermeture: 'CEINTURE_NOUEE' });

  it('places every piece: the belt, its bow and the cuffs are drawn, the facings listed as inside pieces', () => {
    expect(coat.ignored).toEqual([]);
    expect(coat.inside).toEqual(['Parementure Devant', 'Parementure Jupe Devant', 'Parementure Dos']);
    const belt = coat.panels.find((p) => p.zone === 'belt')!;
    expect(belt).toBeDefined();
    // Belt + the three bow pieces highlight together.
    expect(belt.pieceIds).toHaveLength(4);
    expect(coat.panels.filter((p) => p.zone === 'cuff')).toHaveLength(2);
  });

  it('wraps the belt round the waist, over the cloth, with the bow standing out at the centre front', () => {
    const belt = coat.panels.find((p) => p.zone === 'belt')!;
    const cloth = coat.panels.filter((p) => p.role === 'front' || p.role === 'back');
    const [lo, hi] = range(belt.positions, 1);
    // The cloth's front at the belt's own height (the skirt flares further forward lower down).
    let clothFront = -Infinity;
    for (const p of cloth) {
      for (let i = 0; i < p.positions.length; i += 3) {
        if (Math.abs(p.positions[i]!) < 0.05 && p.positions[i + 1]! > hi - 0.05 && p.positions[i + 1]! < hi) clothFront = Math.max(clothFront, p.positions[i + 2]!);
      }
    }
    expect(clothFront).toBeGreaterThan(-Infinity);
    expect(hi - lo).toBeGreaterThan(0.04);
    expect(hi - lo).toBeLessThan(0.3); // the tails hang ~20 cm
    const [, front] = range(belt.positions, 2);
    expect(front).toBeGreaterThan(clothFront - 0.02);
    const [left, right] = range(belt.positions, 0);
    expect(right).toBeCloseTo(-left, 1);
  });

  it('puts each cuff at the end of its sleeve, towards the hand', () => {
    for (const side of [1, -1]) {
      const cuff = coat.panels.find((p) => p.zone === 'cuff' && p.id.endsWith(`-${side}`))!;
      const sleeve = coat.panels.find((p) => p.role === 'sleeve' && p.id.endsWith(`-${side}`))!;
      const [cuffLo] = range(cuff.positions, 1);
      const [sleeveLo] = range(sleeve.positions, 1);
      expect(cuffLo).toBeLessThan(sleeveLo); // carries on below the sleeve's edge
      expect(Math.sign(range(cuff.positions, 0)[0] + range(cuff.positions, 0)[1])).toBe(side);
    }
  });

  it('a dress without belt or cuffs draws none', () => {
    const plain = model({ manches: 'LONGUES' });
    expect(plain.panels.some((p) => p.zone === 'belt' || p.zone === 'cuff')).toBe(false);
    expect(plain.inside).toEqual([]);
  });
});

describe('beltRadius', () => {
  it('fills the angles no cloth was sampled at from their neighbours, round the circle', () => {
    const bins = new Float64Array(8);
    bins[0] = 0.2;
    bins[4] = 0.1;
    const r = beltRadius(bins);
    expect(r(0)).toBeGreaterThan(r(Math.PI));
    expect(r((2 * Math.PI) / 8 * 2)).toBeCloseTo(0.15, 2);
    expect(r(-0.1)).toBeCloseTo(r(2 * Math.PI - 0.1));
    expect(beltRadius(new Float64Array(4))(1)).toBe(0.12);
  });
});

describe('drapeCuff', () => {
  it('a closed band starting just over the ring and running along the arm', () => {
    const ring: Array<[number, number, number]> = Array.from({ length: 12 }, (_, j) => [0.03 * Math.cos((j * Math.PI) / 6), 0.8, 0.03 * Math.sin((j * Math.PI) / 6)]);
    const cuff = drapeCuff(ring, [0, -1, 0], 0.035);
    const ys = cuff.positions.filter((_, i) => i % 3 === 1);
    expect(Math.max(...ys)).toBeCloseTo(0.806, 3);
    expect(Math.min(...ys)).toBeCloseTo(0.765, 3);
    expect(cuff.indices.length).toBeGreaterThan(0);
  });
});
