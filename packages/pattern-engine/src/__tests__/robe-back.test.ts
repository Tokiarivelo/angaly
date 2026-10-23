import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import type { PatternPieceGeometry } from '../types';

const M = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const dress = (dos?: string) =>
  RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'DROITE', style: null, details: { longueur: 'GENOU', ...(dos ? { dos } : {}) } }, M);
const back = (dos?: string): PatternPieceGeometry => dress(dos).find((p) => p.name === 'Corsage Dos')!;
const centreDepth = (p: PatternPieceGeometry) => p.outlineMm[0]!.y;
const height = (p: PatternPieceGeometry) => Math.max(...p.outlineMm.map((q) => q.y));

describe('dress back (détail « dos »)', () => {
  it('lowers the centre back for a V, lower again for a bare back, keeps the plain back high', () => {
    const plain = centreDepth(back());
    expect(centreDepth(back('FERME'))).toBe(plain);
    expect(centreDepth(back('DECOLLETE_V'))).toBeGreaterThan(plain + 100);
    const bare = back('DOS_NU');
    expect(centreDepth(bare)).toBeGreaterThan(centreDepth(back('DECOLLETE_V')));
    expect(height(bare) - centreDepth(bare)).toBeLessThanOrEqual(80);
  });

  it('cuts a teardrop into the centre back under the neck (goutte)', () => {
    const drop = back('GOUTTE');
    const onCentre = drop.outlineMm.filter((p) => p.y > centreDepth(drop) + 40 && p.y < centreDepth(drop) + 150 && p.x > 10);
    expect(onCentre.length).toBeGreaterThan(0);
    expect(centreDepth(drop)).toBe(centreDepth(back()));
  });

  it('adds the tulle of a sheer back, the fabric cut low under it', () => {
    const pieces = dress('TRANSPARENT');
    expect(pieces.map((p) => p.name)).toContain('Tulle du dos (transparent)');
    expect(centreDepth(back('TRANSPARENT'))).toBeGreaterThan(centreDepth(back()) + 100);
    expect(dress().map((p) => p.name)).not.toContain('Tulle du dos (transparent)');
  });

  it('keeps every back outline closed and sound', () => {
    for (const dos of ['FERME', 'DECOLLETE_V', 'DOS_NU', 'GOUTTE', 'TRANSPARENT']) {
      for (const p of dress(dos)) {
        expect(p.outlineMm[0], `${dos} ${p.name}`).toEqual(p.outlineMm.at(-1));
        expect(hasSelfIntersection(p.outlineMm), `${dos} ${p.name}`).toBe(false);
      }
    }
  });
});
