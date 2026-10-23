import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { PantalonRule } from '../../../../../../packages/pattern-engine/src/rules/pantalon.rule';
import { JupeRule } from '../../../../../../packages/pattern-engine/src/rules/jupe.rule';
import { buildGarmentModel, type PanelMeshData } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };

const dto = (pieces: ReturnType<typeof PantalonRule.computePieces>): PatternPieceDto[] =>
  pieces.map(
    (p, i) =>
      ({
        id: `p${i}`,
        versionId: 'v',
        name: p.name,
        dimensionsJson: { outlineMm: p.outlineMm, ...(p.internalLinesMm ? { internalLinesMm: p.internalLinesMm } : {}) },
        fabricRecommendation: null,
        quantity: p.quantity,
        grainlineJson: null,
        seamAllowanceCm: 1,
        notchesJson: [],
      }) as unknown as PatternPieceDto,
  );

const model = (garment: 'PANTALON' | 'JUPE', details: Record<string, string>) => {
  const rule = garment === 'PANTALON' ? PantalonRule : JupeRule;
  const pieces = dto(rule.computePieces({ garmentType: garment, cutType: 'DROITE', style: null, details }, M));
  const built = buildGarmentModel(pieces, garment, M);
  if (!built.ok) throw new Error(built.reason);
  return { pieces, panels: built.model.panels };
};

const centroid = (p: PanelMeshData): [number, number, number] => {
  const c: [number, number, number] = [0, 0, 0];
  const n = p.positions.length / 3;
  for (let i = 0; i < n; i += 1) for (let k = 0; k < 3; k += 1) c[k] = c[k]! + p.positions[i * 3 + k]! / n;
  return c;
};
/** Distance (m) from each vertex of `a` to the nearest vertex of `b`: the largest. */
const farthestFrom = (a: PanelMeshData, b: PanelMeshData): number => {
  let worst = 0;
  for (let i = 0; i < a.positions.length; i += 3) {
    let best = Infinity;
    for (let j = 0; j < b.positions.length; j += 3) {
      best = Math.min(best, Math.hypot(a.positions[i]! - b.positions[j]!, a.positions[i + 1]! - b.positions[j + 1]!, a.positions[i + 2]! - b.positions[j + 2]!));
    }
    worst = Math.max(worst, best);
  }
  return worst;
};
const norm = (v: { x: number; y: number; z: number }): number => Math.hypot(v.x, v.y, v.z);

describe('trousers taken apart as cut: each piece, and each detail piece, is a panel of its own', () => {
  const { pieces, panels } = model('PANTALON', { fermeture: 'BRAGUETTE_ZIP', poches: 'ITALIENNES', poches_dos: 'PLAQUEES', bas: 'REVERS', longueur: 'SOL' });
  const idOf = (name: string): string => pieces.find((p) => p.name === name)!.id;
  const details = panels.filter((p) => p.zone === 'detail');

  it('splits each leg into its front and back piece, exploding forwards and backwards to its own side', () => {
    const front = panels.find((p) => p.id === 'legs-1-front')!;
    const back = panels.find((p) => p.id === 'legs-1-back')!;
    expect(front.pieceIds).toEqual([idOf('Devant Pantalon')]);
    expect(back.pieceIds).toEqual([idOf('Dos Pantalon')]);
    expect(front.explode.z).toBeGreaterThan(0);
    expect(back.explode.z).toBeLessThan(0);
    expect(panels.find((p) => p.id === 'legs--1-front')!.explode.x).toBeLessThan(0);
    // The front piece is at the front of the leg, the back piece behind it.
    expect(centroid(front)[2]).toBeGreaterThan(centroid(back)[2]);
    for (const p of [front, back]) expect(Math.max(...p.indices)).toBeLessThan(p.positions.length / 3);
  });

  it('closes the centre back seam: the two back pieces meet in the middle from the waist down the seat', () => {
    for (const id of ['legs-1-back', 'legs--1-back']) {
      const back = panels.find((p) => p.id === id)!;
      // Per height band over the seat, the back piece's vertex closest to the middle (behind the body).
      const closest = new Map<number, number>();
      let top = -Infinity;
      for (let i = 0; i < back.positions.length; i += 3) top = Math.max(top, back.positions[i + 1]!);
      for (let i = 0; i < back.positions.length; i += 3) {
        const y = back.positions[i + 1]!;
        if (y > top - 0.03 || y < top - 0.2) continue;
        const band = Math.round(y * 50);
        closest.set(band, Math.min(closest.get(band) ?? Infinity, Math.abs(back.positions[i]!)));
      }
      expect(closest.size).toBeGreaterThan(3);
      for (const x of closest.values()) expect(x).toBeLessThan(0.003);
    }
  });

  it('lays the fly facing and shield under the left front only, highlighted with both pieces', () => {
    const fly = details.filter((p) => p.label.includes('braguette'));
    expect(fly).toHaveLength(1);
    expect(fly[0]!.pieceIds.sort()).toEqual([idOf('Parementure de braguette'), idOf('Sous-patte de braguette')].sort());
    expect(centroid(fly[0]!)[0]).toBeGreaterThan(0);
    // On the front piece's cloth, a few millimetres under it.
    expect(farthestFrom(fly[0]!, panels.find((p) => p.id === 'legs-1-front')!)).toBeLessThan(0.02);
  });

  it('puts a patch pocket on each back piece, the slanted pockets’ bags inside in lining, a turn-up round each hem', () => {
    const patch = details.filter((p) => p.label === 'Poche plaquée arrière');
    expect(patch).toHaveLength(2);
    expect(farthestFrom(patch.find((p) => centroid(p)[0] > 0)!, panels.find((p) => p.id === 'legs-1-back')!)).toBeLessThan(0.02);
    const bags = details.filter((p) => p.label.includes('Fond de Poche'));
    expect(bags).toHaveLength(2);
    expect(bags.every((p) => p.lining === true)).toBe(true);
    expect(details.filter((p) => p.label === 'Bande de revers de bas')).toHaveLength(2);
  });

  it('sends every detail piece further than the piece it is sewn to, so the exploded view shows it on its own', () => {
    for (const d of details) {
      const side = centroid(d)[0] > 0 ? '1' : '-1';
      const hosts = panels.filter((p) => p.id.startsWith(`legs-${side}-`) && p.zone === 'legs');
      const host = hosts.reduce((a, b) => (Math.abs(b.explode.z - d.explode.z) < Math.abs(a.explode.z - d.explode.z) ? b : a));
      expect(norm(d.explode)).toBeGreaterThan(norm(host.explode) * 1.3);
      expect(Math.sign(d.explode.x)).toBe(Math.sign(host.explode.x));
    }
  });
});

describe('skirt detail pieces', () => {
  it('lays a patch pocket on each half of the skirt front', () => {
    const { panels } = model('JUPE', { poches: 'PLAQUEES' });
    const pockets = panels.filter((p) => p.zone === 'detail' && p.label === 'Poche plaquée');
    expect(pockets).toHaveLength(2);
    expect(Math.sign(centroid(pockets[0]!)[0])).toBe(-Math.sign(centroid(pockets[1]!)[0]));
    const front = panels.find((p) => p.id === 'skirt-front')!;
    for (const p of pockets) expect(farthestFrom(p, front)).toBeLessThan(0.03);
  });
});
