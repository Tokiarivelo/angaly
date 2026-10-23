import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { openCentreFront } from '../shared/shapes';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const make = (details: Record<string, string>) =>
  RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', ...details } }, M);

describe('openCentreFront', () => {
  it('moves the centre line off the fold along the opening and resamples it', () => {
    const square = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 400 }, { x: 0, y: 400 }, { x: 0, y: 0 }];
    const out = openCentreFront(square, (y) => 20 + y / 10);
    expect(out.every((p) => p.x >= 20)).toBe(true);
    expect(out.length).toBeGreaterThan(square.length);
    expect(hasSelfIntersection(out)).toBe(false);
  });
});

describe('RobeRule — robe-manteau (devant MANTEAU_OUVERT, cordelière)', () => {
  const pieces = make({ devant: 'MANTEAU_OUVERT', fermeture: 'CORDELIERE' });
  const piece = (start: string) => pieces.find((p) => p.name.startsWith(start))!;

  it('cuts two fronts that part from the neck to the hem', () => {
    const bodice = piece('Corsage Devant');
    const skirt = piece('Jupe Devant');
    expect(bodice.quantity).toBe(2);
    expect(skirt.quantity).toBe(2);
    expect(Math.min(...skirt.outlineMm.map((p) => p.x))).toBeGreaterThanOrEqual(25);
    // The opening widens towards the hem.
    const hemY = Math.max(...skirt.outlineMm.map((p) => p.y));
    const atHem = Math.min(...skirt.outlineMm.filter((p) => p.y === hemY).map((p) => p.x));
    const atTop = Math.min(...skirt.outlineMm.filter((p) => p.y === 0).map((p) => p.x));
    expect(atHem).toBeGreaterThan(atTop * 2);
    for (const p of [bodice, skirt]) expect(hasSelfIntersection(p.outlineMm)).toBe(false);
  });

  it('adds the plastron behind the opening and the cord', () => {
    const plastron = piece('Plastron');
    expect(plastron).toBeDefined();
    expect(Math.max(...plastron.outlineMm.map((p) => p.y))).toBeGreaterThan(1000);
    expect(piece('Cordelière')).toBeDefined();
  });

  it('a closed front keeps one front on the fold, no plastron, no cord', () => {
    const closed = make({});
    expect(closed.some((p) => p.name.startsWith('Plastron') || p.name === 'Cordelière')).toBe(false);
    expect(closed.find((p) => p.name === 'Corsage Devant')!.quantity).toBe(1);
  });
});

describe('RobeRule — jupe en lés: a bell, flaring from the waist', () => {
  const widthAt = (pieces: ReturnType<typeof make>, dy: number): number => {
    let total = 0;
    for (const p of pieces) {
      if (!p.name.startsWith('Jupe')) continue;
      const o = p.outlineMm;
      const y = Math.min(...o.map((q) => q.y)) + dy;
      const xs: number[] = [];
      for (let i = 0; i < o.length; i += 1) {
        const a = o[i]!;
        const b = o[(i + 1) % o.length]!;
        if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
      }
      // A front cut on the fold (×1) is half the front.
      const fold = p.quantity === 1 && Math.min(...o.map((q) => q.x)) === 0 ? 2 : p.quantity;
      if (xs.length > 1) total += (Math.max(...xs) - Math.min(...xs)) * fold;
    }
    return total;
  };

  it('is wider than the straight A just under the waist, as wide at the hem, and covers the hips', () => {
    const straight = make({});
    const gored = make({ jupe: 'EN_LES' });
    // 20 cm under the waist (the hip line): the bell already stands well off the A, and off the hips.
    expect(widthAt(gored, 200) - widthAt(straight, 200)).toBeGreaterThan(80);
    expect(widthAt(gored, 200)).toBeGreaterThan(M.TOUR_BASSIN * 10 + 100);
    // Same waist and hem: only the line between them changes.
    expect(Math.abs(widthAt(gored, 1040) - widthAt(straight, 1040))).toBeLessThan(0.01 * widthAt(straight, 1040));
  });

  it('flares less and less on the way down (a convex side seam)', () => {
    const gored = make({ jupe: 'EN_LES' });
    const steps = [50, 250, 450, 650, 850].map((y) => widthAt(gored, y + 200) - widthAt(gored, y));
    for (let i = 1; i < steps.length; i += 1) expect(steps[i]!).toBeLessThanOrEqual(steps[i - 1]! + 1);
  });
});
