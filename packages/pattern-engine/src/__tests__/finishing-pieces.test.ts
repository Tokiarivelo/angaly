import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { BELT_HEIGHT_MM, CUFF_HEIGHT_MM, beltPieces, facingPiece } from '../shared/shapes';

const M = { TOUR_COU: 36, TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const make = (details: Record<string, string>, extra: Record<string, unknown> = {}) =>
  RobeRule.computePieces(
    { garmentType: 'ROBE', cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', ...details }, ...extra },
    M,
  );
const bounds = (outline: Array<{ x: number; y: number }>) => ({
  w: Math.max(...outline.map((p) => p.x)) - Math.min(...outline.map((p) => p.x)),
  h: Math.max(...outline.map((p) => p.y)) - Math.min(...outline.map((p) => p.y)),
});

describe('facingPiece', () => {
  it('follows the chosen run of the edge and goes the width into the piece', () => {
    const square = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 400 }, { x: 0, y: 400 }, { x: 0, y: 0 }];
    // The left edge, from bottom (index 3) to top (index 0).
    const f = facingPiece('Parementure', square, 3, 0, 50, 2)!;
    expect(f.quantity).toBe(2);
    expect(f.outlineMm.every((p) => p.x >= 0 && p.x <= 50)).toBe(true);
    expect(bounds(f.outlineMm)).toEqual({ w: 50, h: 400 });
    expect(hasSelfIntersection(f.outlineMm)).toBe(false);
    expect(facingPiece('x', square, 1, 1, 50, 1)).toBeNull();
  });
});

describe('beltPieces', () => {
  it('a belt round the waist plus overlap, the bow loops, knot and two tails, all cut double', () => {
    const [belt, loops, knot, tails] = beltPieces(780);
    expect(belt!.name).toBe('Ceinture');
    expect(bounds(belt!.outlineMm)).toEqual({ w: 840, h: 2 * BELT_HEIGHT_MM });
    expect(loops!.name).toMatch(/Nœud/);
    expect(knot!.name).toMatch(/Nœud/);
    expect(tails!.quantity).toBe(2);
    for (const p of beltPieces(780)) expect(hasSelfIntersection(p.outlineMm)).toBe(false);
  });
});

describe('RobeRule — finishing pieces of a robe-manteau (Victorian coat-dress)', () => {
  const pieces = make(
    { devant: 'MANTEAU_OUVERT', col: 'OFFICIER', manches: 'BALLON', fermeture: 'CEINTURE_NOUEE' },
    { lengths: { sleevePct: 100 }, fullness: { sleeve: 2.5 } },
  );
  const piece = (name: string) => pieces.find((p) => p.name === name);

  it('faces the open fronts down to the hem and the back neckline', () => {
    const bodice = piece('Parementure Devant')!;
    const skirt = piece('Parementure Jupe Devant')!;
    const back = piece('Parementure Dos')!;
    for (const f of [bodice, skirt, back]) {
      expect(f).toBeDefined();
      expect(hasSelfIntersection(f.outlineMm)).toBe(false);
    }
    expect(bodice.quantity).toBe(2);
    expect(skirt.quantity).toBe(2);
    // The skirt facing runs the whole length of the skirt's opening, the bodice one from the neck to the waist.
    const skirtFront = piece('Jupe Devant (manteau ouvert)')!;
    expect(bounds(skirt.outlineMm).h).toBeGreaterThan(bounds(skirtFront.outlineMm).h * 0.9);
    expect(bounds(bodice.outlineMm).h).toBeGreaterThan(300);
    // A narrow band, not a copy of the piece.
    expect(bounds(skirt.outlineMm).w).toBeLessThan(200);
    expect(bounds(back.outlineMm).h).toBeLessThan(120);
  });

  it('ends the long gigot sleeve in a cuff as long as its lower edge, the sleeve shorter by the cuff', () => {
    // The long gigot is in two pieces: their lower edges together go round the wrist.
    const hemOf = (o: Array<{ x: number; y: number }>) => {
      const bottom = Math.max(...o.map((p) => p.y));
      const xs = o.filter((p) => bottom - p.y < 1).map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    const upper = piece('Manche extérieure')!;
    const under = piece('Manche intérieure')!;
    const cuff = piece('Poignet')!;
    expect(cuff.quantity).toBe(2);
    expect(bounds(cuff.outlineMm).h).toBe(2 * CUFF_HEIGHT_MM);
    expect(Math.abs(bounds(cuff.outlineMm).w - 20 - (hemOf(upper.outlineMm) + hemOf(under.outlineMm)))).toBeLessThan(2);
    // 80 % of the arm (472 mm) stops above the wrist: no cuff, one piece, and 590 − 35 − 472 mm shorter.
    const shorter = make({ manches: 'BALLON' }, { lengths: { sleevePct: 80 }, fullness: { sleeve: 2.5 } });
    expect(shorter.some((p) => p.name === 'Poignet')).toBe(false);
    const short = shorter.find((p) => p.name === 'Manche')!;
    expect(bounds(upper.outlineMm).h - bounds(short.outlineMm).h).toBe(590 - CUFF_HEIGHT_MM - 472);
  });

  it('adds the tied belt and bow, and keeps the band collar (outer + inner)', () => {
    expect(piece('Ceinture')).toBeDefined();
    expect(pieces.filter((p) => p.name.includes('Nœud') || p.name.includes('nœud'))).toHaveLength(3);
    expect(piece('Col officier')!.quantity).toBe(2);
  });

  it('a short or plain sleeve has no cuff; a closed dress no facings; no belt without CEINTURE_NOUEE', () => {
    const plain = make({ manches: 'BALLON' });
    expect(plain.some((p) => p.name === 'Poignet')).toBe(false);
    expect(plain.some((p) => p.name.startsWith('Parementure'))).toBe(false);
    expect(plain.some((p) => p.name === 'Ceinture')).toBe(false);
    expect(make({ manches: 'LONGUES' }).some((p) => p.name === 'Poignet')).toBe(false);
    expect(make({ manches: 'EVEQUE' }).some((p) => p.name === 'Poignet')).toBe(true);
  });
});
