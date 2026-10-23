import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { goreSplit, rowExtentOf, twoPieceSleeve } from '../shared/panels';
import { sleevePiece } from '../shared/shapes';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const make = (details: Record<string, string>) =>
  RobeRule.computePieces(
    {
      garmentType: 'ROBE',
      cutType: 'PRINCESSE',
      style: null,
      details: { longueur: 'SOL', ...details },
      lengths: { sleevePct: 100 },
      fullness: { sleeve: 2.5, skirt: 2.7 },
    },
    M,
  );
const width = (o: Array<{ x: number; y: number }>, y: number): number => {
  const e = rowExtentOf(o.slice(0, -1), y);
  return e ? e[1] - e[0] : 0;
};

describe('goreSplit', () => {
  const half = [{ x: 0, y: 0 }, { x: 200, y: 10 }, { x: 600, y: 1000 }, { x: 0, y: 1000 }, { x: 0, y: 0 }];
  const split = goreSplit(half)!;

  it('cuts a skirt half into a centre panel and a side gore of the same heights, with no width lost', () => {
    for (const y of [50, 400, 990]) expect(width(split.centre, y) + width(split.side, y)).toBeCloseTo(width(half, y), 0);
    // Half of the width at the hem, and the centre keeps the centre line.
    expect(width(split.centre, 990)).toBeCloseTo(width(half, 990) / 2, -1);
    expect(Math.min(...split.centre.map((p) => p.x))).toBe(0);
    for (const o of [split.centre, split.side]) expect(hasSelfIntersection(o)).toBe(false);
  });
});

describe('twoPieceSleeve', () => {
  const sleeve = sleevePiece('Manche', 920, { lengthMm: 520, cuffRatio: 0.7, topRatio: 1.35 * 2.5 }).outlineMm;
  const split = twoPieceSleeve(sleeve, 57)!;
  const capY = sleeve[0]!.y;

  it('keeps the cap and the puff in the upper sleeve, a fitted under sleeve centred on the old seam', () => {
    expect(Math.min(...split.upper.map((p) => p.y))).toBe(Math.min(...sleeve.map((p) => p.y)));
    expect(Math.min(...split.under.map((p) => p.y))).toBe(capY);
    for (const y of [capY + 100, capY + 300, capY + 500]) {
      expect(width(split.upper, y) + width(split.under, y)).toBeCloseTo(width(sleeve, y), 0);
      expect(width(split.under, y)).toBeLessThanOrEqual(114.1);
    }
    expect(Math.min(...split.under.map((p) => p.x))).toBeCloseTo(-Math.max(...split.under.map((p) => p.x)));
    for (const o of [split.upper, split.under]) expect(hasSelfIntersection(o)).toBe(false);
  });

  it('is null for a sleeve too short to split', () => {
    expect(twoPieceSleeve(sleevePiece('Manche', 920, { lengthMm: 20, cuffRatio: 1, topRatio: 1 }).outlineMm, 57)).toBeNull();
  });
});

describe('RobeRule — gores, revers, two-piece gigot', () => {
  const pieces = make({ devant: 'MANTEAU_REVERS', col: 'OFFICIER', manches: 'BALLON', fermeture: 'CEINTURE_NOUEE', jupe: 'EN_LES' });
  const names = pieces.map((p) => p.name);

  it('cuts the skirt in six gores (centre front pair, two side fronts, two side backs, back pair)', () => {
    expect(names).toEqual(expect.arrayContaining(['Jupe Devant (manteau ouvert)', 'Jupe Côté Devant', 'Jupe Dos', 'Jupe Côté Dos']));
    for (const n of ['Jupe Côté Devant', 'Jupe Côté Dos']) expect(pieces.find((p) => p.name === n)!.quantity).toBe(2);
    const plain = make({ devant: 'MANTEAU_OUVERT' });
    expect(plain.some((p) => p.name.startsWith('Jupe Côté'))).toBe(false);
  });

  it('adds the revers along the bodice opening: narrow at the waist, widest over the bust', () => {
    const revers = pieces.find((p) => p.name === 'Revers')!;
    expect(revers.quantity).toBe(2);
    expect(hasSelfIntersection(revers.outlineMm)).toBe(false);
    const xs = revers.outlineMm.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(40);
    // A plain coat-dress has facings but no revers.
    expect(make({ devant: 'MANTEAU_OUVERT' }).some((p) => p.name === 'Revers')).toBe(false);
    // Still a coat-dress: plastron and facings.
    expect(names).toEqual(expect.arrayContaining(['Plastron (sous-robe)', 'Parementure Devant']));
  });

  it('drafts the long gigot on a two-piece sleeve; a long plain sleeve stays one piece', () => {
    expect(names).toEqual(expect.arrayContaining(['Manche extérieure', 'Manche intérieure']));
    expect(names).not.toContain('Manche');
    expect(make({ manches: 'LONGUES' }).map((p) => p.name)).toContain('Manche');
  });
});

describe('skirtOutline — flared skirts are an A from the waist', () => {
  it('puts the hip point on the straight waist → hem line when the hem flares more than the hips', async () => {
    const { skirtOutline } = await import('../shared/shapes');
    const o = skirtOutline(180, 255, 700, 1050, false, 200);
    const hip = o[2]!;
    expect(hip.x).toBeCloseTo(180 + ((700 - 180) * 190) / 1040, 0);
    // A narrow skirt keeps its hip width.
    expect(skirtOutline(180, 255, 280, 600, false, 200)[2]!.x).toBe(255);
  });
});
