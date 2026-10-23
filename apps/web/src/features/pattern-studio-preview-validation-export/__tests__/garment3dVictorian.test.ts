import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { RobeRule } from '../../../../../../packages/pattern-engine/src/rules/robe.rule';
import { buildGarmentModel, NOT_EDITABLE } from '../utils/garment3d/garment-model';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const model = (details: Record<string, string>, fullness: Record<string, number> = { sleeve: 2.5, skirt: 3.2 }) => {
  const pieces = RobeRule.computePieces(
    { garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', ...details }, lengths: { sleevePct: 100 }, fullness },
    M,
  ).map(
    (p, i) =>
      ({ id: `p${i}`, versionId: 'v', name: p.name, dimensionsJson: { outlineMm: p.outlineMm }, fabricRecommendation: null, quantity: p.quantity, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] }) as unknown as PatternPieceDto,
  );
  const built = buildGarmentModel(pieces, 'ROBE', M);
  if (!built.ok) throw new Error(built.reason);
  return { model: built.model, pieces };
};
const idOf = (pieces: PatternPieceDto[], name: string) => pieces.find((p) => p.name === name)!.id;

describe('3D of a Victorian coat-dress (gores, two-piece gigot, revers)', () => {
  const { model: dress, pieces } = model({ devant: 'MANTEAU_REVERS', col: 'OFFICIER', manches: 'BALLON', fermeture: 'CEINTURE_NOUEE', jupe: 'EN_LES' });

  it('drapes the two-piece sleeve as one sleeve per arm, both pieces editable through it', () => {
    const sleeves = dress.panels.filter((p) => p.role === 'sleeve');
    expect(sleeves).toHaveLength(2);
    const upper = idOf(pieces, 'Manche extérieure');
    const under = idOf(pieces, 'Manche intérieure');
    for (const s of sleeves) {
      expect(s.pieceIds).toEqual([upper, under]);
      const used = new Set(Array.from(s.edit!.piece).filter((k) => k !== NOT_EDITABLE).map((k) => s.edit!.pieceIds[k]));
      expect(used).toEqual(new Set([upper, under]));
    }
    expect(dress.ignored).toEqual([]);
  });

  it('marks the puff (cap and balloon) as the accent fabric and leaves the fitted forearm plain', () => {
    const s = dress.panels.find((p) => p.role === 'sleeve')!;
    const accent = Array.from(s.accent!);
    expect(accent[0]).toBe(1);
    expect(accent[accent.length - 1]).toBe(0);
    // The balloon closes on the arm well before the wrist.
    const share = accent.filter((a) => a === 1).length / accent.length;
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.8);
  });

  it('joins each skirt half from its centre panel and side gore, with the seam between them drawn', () => {
    const skirt = dress.panels.filter((p) => p.zone === 'skirt' && (p.role === 'front' || p.role === 'back'));
    expect(skirt).toHaveLength(2);
    const front = skirt.find((p) => p.role === 'front')!;
    expect(front.pieceIds).toEqual(expect.arrayContaining([idOf(pieces, 'Jupe Devant (manteau ouvert)'), idOf(pieces, 'Jupe Côté Devant')]));
    const plain = model({ devant: 'MANTEAU_REVERS', col: 'OFFICIER', manches: 'BALLON', jupe: 'DEUX_PANS' }).model;
    const plainFront = plain.panels.find((p) => p.zone === 'skirt' && p.role === 'front')!;
    // The gore seams add lines over the cloth.
    expect(front.border.length).toBeGreaterThan(plainFront.border.length);
  });

  it('lays the revers on the bodice front, mirrored on both sides of the opening', () => {
    const revers = dress.panels.find((p) => p.zone === 'revers')!;
    expect(revers.pieceIds).toEqual([idOf(pieces, 'Revers')]);
    let left = 0;
    let right = 0;
    for (let i = 0; i < revers.positions.length; i += 3) {
      if (revers.positions[i]! > 0) right += 1;
      else left += 1;
    }
    expect(left).toBe(right);
  });

  it('starts the plastron at the top of the opening under a band collar (no gap under the collar)', () => {
    const plastron = dress.panels.find((p) => p.zone === 'plastron' && p.id.startsWith('bodice'))!;
    const front = dress.panels.find((p) => p.zone === 'bodice' && p.role === 'front')!;
    const top = (a: Float32Array) => Math.max(...Array.from(a).filter((_, i) => i % 3 === 1));
    expect(top(front.positions) - top(plastron.positions)).toBeLessThan(0.04);
  });

  it('darkens the hollows of the godets (ambient occlusion) and hangs the flared skirt straight from the seat', () => {
    const back = dress.panels.find((p) => p.zone === 'skirt' && p.role === 'back')!;
    const ao = Array.from(back.ao!);
    expect(Math.min(...ao)).toBeLessThan(0.7);
    expect(Math.max(...ao)).toBe(1);
    // Depth of the back below the seat never shrinks again (no mermaid hollow under it).
    const C = 29;
    const depthAt = (row: number) => Math.min(...Array.from({ length: C }, (_, j) => back.positions[(row * C + j) * 3 + 2]!));
    for (let row = 10; row + 4 <= 48; row += 4) expect(depthAt(row + 4)).toBeLessThanOrEqual(depthAt(row) + 0.002);
  });
});
