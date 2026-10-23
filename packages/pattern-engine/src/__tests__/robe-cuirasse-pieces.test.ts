import { describe, expect, it } from 'vitest';
import { RobeRule } from '../rules/robe.rule';
import { princessSplit } from '../shared/panels';
import { hasSelfIntersection } from '../shared/geometry-checks';

const M = { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 96, LONGUEUR_DOS: 40 };
const CUIRASSE = {
  col: 'OFFICIER',
  jupe: 'EN_LES',
  devant: 'GILET',
  taille: 'BASSE',
  corsage: 'PRINCESSE',
  basque: 'PANS_CROISES',
  manches: 'TAILLEUR',
  longueur: 'SOL',
  fermeture: 'BOUTONS',
};
const make = (details: Record<string, string>) =>
  RobeRule.computePieces({ garmentType: 'ROBE', cutType: 'AJUSTEE', style: null, ease: 'AJUSTE', fullness: { skirt: 2 }, details }, M);
const area = (o: Array<{ x: number; y: number }>): number => {
  let a = 0;
  for (let i = 0; i + 1 < o.length; i += 1) a += o[i]!.x * o[i + 1]!.y - o[i + 1]!.x * o[i]!.y;
  return Math.abs(a) / 2;
};
const named = (pieces: ReturnType<typeof make>, name: string) => pieces.find((p) => p.name === name);

describe('princessSplit', () => {
  const bodice = [
    { x: 0, y: 20 },
    { x: 75, y: 0 },
    { x: 220, y: 45 },
    { x: 220, y: 231 },
    { x: 175, y: 420 },
    { x: 219, y: 530 },
    { x: 0, y: 530 },
    { x: 0, y: 20 },
  ];
  const split = princessSplit(bodice, { shoulderY: 45, underarmY: 231, waistY: 420 })!;

  it('cuts the bodice into a centre and a side panel that add up to it', () => {
    expect(split).not.toBeNull();
    expect(area(split.centre) + area(split.side)).toBeCloseTo(area(bodice), -1);
    expect(hasSelfIntersection(split.centre)).toBe(false);
    expect(hasSelfIntersection(split.side)).toBe(false);
  });

  it('leaves the armhole part way down and crosses the waist at half its width', () => {
    const top = Math.min(...split.side.map((p) => p.y));
    expect(top).toBeGreaterThan(45);
    expect(top).toBeLessThan(231);
    const atWaist = split.side.filter((p) => Math.abs(p.y - 420) < 0.5).map((p) => p.x);
    expect(Math.min(...atWaist)).toBeCloseTo(175 / 2, 0);
  });
});

describe('RobeRule — cuirasse dress of the atelier plate (princess bodice, tailored sleeves, gilet basque)', () => {
  const pieces = make(CUIRASSE);

  it('cuts the bodice in princess panels, front and back', () => {
    for (const name of ['Corsage Côté Devant', 'Corsage Côté Dos']) {
      const side = named(pieces, name)!;
      expect(side.quantity).toBe(2);
      expect(hasSelfIntersection(side.outlineMm)).toBe(false);
    }
    expect(make({ ...CUIRASSE, corsage: 'LISSE' }).some((p) => p.name.startsWith('Corsage Côté'))).toBe(false);
  });

  it('cuts a tailored sleeve in two pieces with a faced cuff', () => {
    for (const name of ['Manche extérieure', 'Manche intérieure', 'Poignet', 'Parementure de poignet']) expect(named(pieces, name)?.quantity).toBe(2);
    expect(named(pieces, 'Manche')).toBeUndefined();
    // The cuff is cut single (its facing is a piece of its own): as high as the finished cuff.
    const cuff = named(pieces, 'Poignet')!.outlineMm;
    expect(Math.max(...cuff.map((p) => p.y))).toBe(35);
  });

  it('cuts a buttoned gilet in two halves ending in points, with a button stand', () => {
    const gilet = named(pieces, 'Plastron (gilet)')!;
    expect(gilet.quantity).toBe(2);
    const o = gilet.outlineMm;
    expect(o[0]).toEqual({ x: 0, y: 0 });
    const bottom = Math.max(...o.map((p) => p.y));
    const tip = o.find((p) => p.y === bottom)!;
    expect(tip.x).toBeGreaterThan(15);
    expect(hasSelfIntersection(o)).toBe(false);
  });

  it('widens the gilet over the bust, narrows it at the waist', () => {
    const o = named(pieces, 'Plastron (gilet)')!.outlineMm;
    const widest = Math.max(...o.filter((p) => p.y < 300).map((p) => p.x));
    const waist = Math.min(...o.filter((p) => p.y > 300 && p.y < 500 && p.x > 30).map((p) => p.x));
    expect(widest - waist).toBeGreaterThan(20);
  });

  it('places the gilet points and the crossed tabs on the skirt front, in the contrasting fabric', () => {
    const skirt = named(pieces, 'Jupe Devant')!;
    const details = (skirt.internalLinesMm ?? []).map((l) => l.detail).filter((d) => d !== undefined);
    expect(details.map((d) => d.pieces[0])).toEqual(['Plastron (gilet)', 'Pan croisé']);
    expect(details.every((d) => d.contrast === true)).toBe(true);
    expect(details[0]!.layer).toBe(1);
    expect(named(pieces, 'Pan croisé')!.quantity).toBe(2);
    // The side gores carry none of them.
    expect(named(pieces, 'Jupe Côté Devant')!.internalLinesMm).toBeUndefined();
    expect(make({ ...CUIRASSE, basque: 'AUCUNE' }).some((p) => p.name === 'Pan croisé')).toBe(false);
  });

  it('adds the inner waist stay, the hem facings and the skirt placket', () => {
    expect(named(pieces, 'Ceinture intérieure (gros-grain)')?.quantity).toBe(1);
    expect(pieces.filter((p) => p.name.startsWith('Parementure d’ourlet')).map((p) => p.name)).toEqual([
      'Parementure d’ourlet (Jupe Devant)',
      'Parementure d’ourlet (Jupe Côté Devant)',
      'Parementure d’ourlet (Jupe Dos)',
      'Parementure d’ourlet (Jupe Côté Dos)',
    ]);
    expect(named(pieces, 'Parementure de jupe (fente dos)')?.quantity).toBe(2);
    const midi = make({ ...CUIRASSE, longueur: 'MIDI' });
    expect(midi.some((p) => p.name.startsWith('Parementure d’ourlet') || p.name.startsWith('Ceinture intérieure'))).toBe(false);
  });
});
