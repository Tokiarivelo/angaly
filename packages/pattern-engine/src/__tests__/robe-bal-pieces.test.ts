import { describe, expect, it } from 'vitest';
import { RobeMarieeRule, skirtHemVsJupon } from '../rules/robe-mariee.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import type { PatternParameters } from '../types';
import { createDefaultEngine } from '../eval/fidelity';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
// The ball gown of the 1850s plate: off the shoulders, pointed boned bodice, skirt in gathered gores with a train.
const BAL: PatternParameters = {
  garmentType: 'ROBE_MARIEE',
  cutType: 'PRINCESSE',
  style: null,
  ease: 'AJUSTE',
  fullness: { skirt: 3, sleeve: 1.75 },
  details: { decollete: 'HORS_EPAULES', taille: 'POINTE', corsage: 'BALEINE', manches: 'COURTES', longueur: 'SOL', jupe: 'EN_LES' },
  drape: { blocks: [] },
};
const make = (p: PatternParameters = BAL) => RobeMarieeRule.computePieces(p, M);
// Width of the waist edge (the top 60 mm: a pointed front gore dips at the centre).
const topWidth = (o: Array<{ x: number; y: number }>) => Math.max(...o.filter((p) => p.y < 60).map((p) => p.x));

describe('RobeMarieeRule — ball gown skirt in gathered gores (jupe EN_LES)', () => {
  const pieces = make();
  const gores = pieces.filter((p) => p.name.includes('lé froncé'));
  const train = pieces.find((p) => p.name.startsWith('Jupe Dos — panneau de traîne'))!;

  it('cuts 8 gores and 2 train panels instead of the 3 skirt panels', () => {
    expect(gores.reduce((n, p) => n + p.quantity, 0)).toBe(8);
    expect(train.quantity).toBe(2);
    expect(pieces.some((p) => p.name === 'Jupe Côté' || p.name === 'Jupe Dos avec Traîne')).toBe(false);
    for (const p of [...gores, train]) expect(hasSelfIntersection(p.outlineMm)).toBe(false);
  });

  it('gathers twice the waist seam into the waist, and covers the petticoat at the hem', () => {
    const tops = [...gores, train].reduce((n, p) => n + p.quantity * topWidth(p.outlineMm), 0);
    // Twice the waist seam (the fitted cut takes the seam in below the body waist + 4 cm).
    expect(tops / (74 * 10 + 40)).toBeGreaterThan(1.6);
    const hems = [...gores, train].reduce((n, p) => n + p.quantity * Math.max(...p.outlineMm.map((q) => q.x)), 0);
    expect(hems).toBeGreaterThan(skirtHemVsJupon(BAL, M).juponHemMm);
    // Each gore fits across a 140 cm fabric width.
    for (const p of [...gores, train]) expect(Math.max(...p.outlineMm.map((q) => q.x))).toBeLessThan(1380);
  });

  it('runs the hem down into the train: seams match in length, the centre back is the longest', () => {
    const lengthAt = (name: string, side: 'in' | 'out') => {
      const o = pieces.find((p) => p.name.startsWith(name))!.outlineMm;
      return side === 'in' ? Math.max(...o.filter((q) => q.x === 0).map((q) => q.y)) : o[2]!.y;
    };
    expect(lengthAt('Jupe Côté (', 'out')).toBe(lengthAt('Jupe Côté Dos', 'out'));
    expect(lengthAt('Jupe Côté Dos', 'in')).toBe(o2(train));
    expect(lengthAt('Jupe Dos — panneau', 'in')).toBeGreaterThan(lengthAt('Jupe Devant', 'in') + 500);
    function o2(p: typeof train) { return p.outlineMm[2]!.y; }
  });

  it('follows the bodice point across its gathered width: the front gores dip together, their seams meet', () => {
    const front = pieces.find((p) => p.name.startsWith('Jupe Devant'))!.outlineMm;
    const next = pieces.find((p) => p.name.startsWith('Jupe Côté Devant'))!.outlineMm;
    expect(front[0]).toEqual({ x: 0, y: 70 });
    const frontTop = front.filter((p) => p.y < 70);
    const corner = frontTop.reduce((m, p) => (p.x > m.x ? p : m));
    // The point spans twice the bodice's (gathered 2 ×): wider than the centre gore, so its neighbour dips too.
    expect(corner.y).toBeGreaterThan(0);
    expect(next[0]).toEqual({ x: 0, y: corner.y });
    // Each seam is as long on both sides: the hem row is the same, so the tops must match.
    expect(hasSelfIntersection(front)).toBe(false);
    const plain = make({ ...BAL, details: { ...BAL.details, taille: 'NATURELLE' } }).find((p) => p.name.startsWith('Jupe Devant'))!;
    expect(plain.outlineMm[0]).toEqual({ x: 0, y: 0 });
  });

  it('hangs the heavy skirt from an inner waist stay', () => {
    expect(pieces.find((p) => p.name === 'Ceinture intérieure (gros-grain)')?.quantity).toBe(1);
    const plain = make({ ...BAL, details: { ...BAL.details, jupe: 'DEUX_PANS' } });
    expect(plain.some((p) => p.name.includes('lé froncé') || p.name.startsWith('Ceinture intérieure'))).toBe(false);
  });

  it('lists the waist tape only when no waist stay piece is cut', () => {
    const engine = createDefaultEngine();
    const tape = (p: PatternParameters) => (engine.generate(p, M).metadata.notions ?? []).some((n) => n.label.startsWith('Ruban de taille'));
    expect(tape(BAL)).toBe(false);
    expect(tape({ ...BAL, details: { ...BAL.details, jupe: 'DEUX_PANS' } })).toBe(true);
  });

  it('lets a skirt block win over the gores', () => {
    const block = make({ ...BAL, drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2.5 }] } });
    expect(block.some((p) => p.name.includes('lé froncé'))).toBe(false);
  });
});
