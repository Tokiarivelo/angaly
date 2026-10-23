import { describe, expect, it } from 'vitest';
import { collarPiece } from '../shared/shapes';
import { hasSelfIntersection } from '../shared/geometry-checks';

const M = { TOUR_COU: 36, LONGUEUR_DOS: 42 };
const size = (o: Array<{ x: number; y: number }>) => ({
  w: Math.max(...o.map((p) => p.x)) - Math.min(...o.map((p) => p.x)),
  h: Math.max(...o.map((p) => p.y)) - Math.min(...o.map((p) => p.y)),
});

describe('collarPiece', () => {
  it('returns no piece when the dress has no collar', () => {
    for (const col of [undefined, 'SANS_COL', 'ROND', 'EN_V', 'BATEAU']) expect(collarPiece(col, M)).toBeNull();
  });

  it.each(['OFFICIER', 'CHEMISIER', 'LAVALLIERE', 'CHALE'])('%s is a closed, non self-crossing piece', (col) => {
    const piece = collarPiece(col, M)!;
    expect(piece.name.toLowerCase()).toContain('col');
    expect(piece.outlineMm[0]).toEqual(piece.outlineMm[piece.outlineMm.length - 1]);
    expect(hasSelfIntersection(piece.outlineMm)).toBe(false);
  });

  it('a band collar is as long as the neck plus the overlap, and low', () => {
    const { w, h } = size(collarPiece('OFFICIER', M)!.outlineMm);
    expect(w).toBe(36 * 10 + 20);
    expect(h).toBeLessThanOrEqual(60);
  });

  it('a shawl collar runs from the nape down the chest: much longer than the neck, and wide', () => {
    const { w, h } = size(collarPiece('CHALE', M)!.outlineMm);
    expect(w).toBeGreaterThan(36 * 10 + 20);
    expect(h).toBeGreaterThan(100);
  });
});
