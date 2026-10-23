import { describe, expect, it } from 'vitest';
import { JupeRule } from '../rules/jupe.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import type { PatternParameters, PatternPieceGeometry } from '../types';

const M = { TOUR_TAILLE: 74, TOUR_BASSIN: 98 };
const trousers = (details: Record<string, string>): PatternPieceGeometry[] =>
  PantalonRule.computePieces({ garmentType: 'PANTALON', cutType: 'DROITE', style: null, details } as PatternParameters, M);
const areasOf = (pieces: PatternPieceGeometry[], host: string) =>
  (pieces.find((p) => p.name.startsWith(host))?.internalLinesMm ?? []).flatMap((l) => (l.detail ? [l.detail] : []));

/** Point in polygon (even–odd). */
const inside = (p: { x: number; y: number }, poly: Array<{ x: number; y: number }>): boolean => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

describe('detail areas: where each detail piece lies on the piece that carries it', () => {
  const pieces = trousers({ fermeture: 'BRAGUETTE_ZIP', poches: 'ITALIENNES', poches_dos: 'PLAQUEES', bas: 'REVERS' });

  it('names only pieces the pattern really has, each area closed and inside its host piece', () => {
    const names = new Set(pieces.map((p) => p.name));
    for (const host of ['Devant Pantalon', 'Dos Pantalon']) {
      const outline = pieces.find((p) => p.name.startsWith(host))!.outlineMm;
      const areas = areasOf(pieces, host);
      expect(areas.length).toBeGreaterThan(0);
      for (const d of areas) {
        for (const name of d.pieces) expect(names.has(name)).toBe(true);
        expect(d.area[0]).toEqual(d.area[d.area.length - 1]);
        // Every corner on or inside the host (2 mm of rounding).
        for (const p of d.area) {
          const near = [-2, 0, 2].some((dx) => [-2, 0, 2].some((dy) => inside({ x: p.x + dx, y: p.y + dy }, outline)));
          expect(near).toBe(true);
        }
      }
    }
  });

  it('puts the fly facing and shield inside, the patch pocket and the turn-up outside', () => {
    const front = areasOf(pieces, 'Devant Pantalon');
    const back = areasOf(pieces, 'Dos Pantalon');
    expect(front.find((d) => d.pieces.includes('Parementure de braguette'))?.inside).toBe(true);
    expect(front.find((d) => d.pieces.includes('Fond de Poche'))?.inside).toBe(true);
    expect(back.find((d) => d.pieces.includes('Poche plaquée arrière'))?.inside).toBeUndefined();
    expect(back.find((d) => d.pieces.includes('Bande de revers de bas'))).toBeDefined();
  });

  it('places welt pockets as a strip outside and a bag inside, on skirts too', () => {
    const welts = areasOf(trousers({ poches_dos: 'PASSEPOIL' }), 'Dos Pantalon');
    expect(welts.map((d) => [d.pieces[0], d.inside === true])).toEqual(
      expect.arrayContaining([
        ['Passepoil de poche arrière', false],
        ['Fond de poche arrière', true],
      ]),
    );
    const skirt = JupeRule.computePieces({ garmentType: 'JUPE', cutType: 'DROITE', style: null, details: { poches: 'PLAQUEES' } } as PatternParameters, M);
    expect(areasOf(skirt, 'Devant').map((d) => d.pieces[0])).toContain('Poche plaquée');
  });
});
