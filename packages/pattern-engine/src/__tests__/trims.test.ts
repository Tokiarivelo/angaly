import { describe, expect, it } from 'vitest';
import { createDefaultEngine } from '../eval/fidelity';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { RobeRule } from '../rules/robe.rule';
import { hasSelfIntersection } from '../shared/geometry-checks';
import { pointSkirtTop, pointWaist, WAIST_POINT_DROP_MM } from '../shared/shapes';
import { applyTrimsAndBoning, bertheBand, boneLines, FRILL_GATHER, necklineEdge, polylineLength, trimNotions } from '../shared/trims';
import type { MeasurementSet, PatternParameters, PatternPieceGeometry, Trim } from '../types';

/** The parameters with no garnitures at all (the key left out, as `exactOptionalPropertyTypes` wants). */
const withoutTrims = <T extends { trims?: unknown }>(p: T): Omit<T, 'trims'> => {
  const { trims: _none, ...rest } = p;
  return rest;
};

const M: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const TRIMS: Trim[] = [
  { kind: 'BERTHE', depthMm: 110, pointMm: 140, material: 'DENTELLE', color: '#ecdcb6' },
  { kind: 'SLEEVE_FRILL', tiers: 2, depthMm: 50, material: 'DENTELLE' },
  { kind: 'BEADING', place: 'ENCOLURE', beadMm: 6, rows: 1 },
  { kind: 'BEADING', place: 'BERTHE', beadMm: 5, rows: 1 },
];
/** The reference ball gown (Met 108161) with everything the photo shows. */
const reference = (extra: Partial<PatternParameters> = {}): PatternParameters => ({
  garmentType: 'ROBE_MARIEE',
  cutType: 'PRINCESSE',
  style: null,
  details: { manches: 'COURTES', longueur: 'SOL', decollete: 'HORS_EPAULES', taille: 'POINTE', corsage: 'BALEINE' },
  fullness: { skirt: 3, sleeve: 1.75 },
  lengths: { sleevePct: 20 },
  drape: { blocks: [{ kind: 'PLEATED_SKIRT', pleats: 40, depthMm: 80, type: 'KNIFE' }] },
  trims: { items: TRIMS },
  ...extra,
});
const closed = (o: Array<{ x: number; y: number }>) => o[0]!.x === o[o.length - 1]!.x && o[0]!.y === o[o.length - 1]!.y;
const named = (pieces: PatternPieceGeometry[], start: string) => pieces.find((p) => p.name.startsWith(start));
const lowestAt0 = (o: Array<{ x: number; y: number }>) => Math.max(...o.filter((p) => p.x === 0).map((p) => p.y));

describe('pointed waist (taille POINTE)', () => {
  for (const [rule, garmentType, front] of [
    [RobeRule, 'ROBE', 'Corsage Devant'],
    [RobeMarieeRule, 'ROBE_MARIEE', 'Bustier Devant'],
  ] as const) {
    it(`${garmentType}: the front bodice falls to a point at the centre front, the front skirt dips to meet it`, () => {
      const gen = (taille: string) =>
        rule.computePieces({ garmentType, cutType: 'PRINCESSE', style: null, details: { longueur: 'SOL', taille } }, M);
      const flat = gen('NATURELLE');
      const point = gen('POINTE');
      const bodice = named(point, front)!.outlineMm;
      expect(closed(bodice)).toBe(true);
      expect(hasSelfIntersection(bodice)).toBe(false);
      expect(lowestAt0(bodice) - lowestAt0(named(flat, front)!.outlineMm)).toBe(WAIST_POINT_DROP_MM);
      const skirt = named(point, 'Jupe Devant')!.outlineMm;
      expect(skirt[0]).toEqual({ x: 0, y: WAIST_POINT_DROP_MM });
      expect(hasSelfIntersection(skirt)).toBe(false);
      // The hem does not move.
      expect(Math.max(...skirt.map((p) => p.y))).toBe(Math.max(...named(flat, 'Jupe Devant')!.outlineMm.map((p) => p.y)));
    });
  }

  it('helpers leave outlines without a centre line untouched', () => {
    const square = [{ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 5, y: 0 }];
    expect(pointWaist(square, 70)).toEqual(square);
    expect(pointSkirtTop(square, 70)).toEqual(square);
  });
});

describe('corset boning (corsage BALEINE)', () => {
  const result = createDefaultEngine().generate(reference(), M);

  it('draws bone lines inside every bodice piece, within its outline', () => {
    for (const name of ['Bustier Devant', 'Bustier Côté', 'Bustier Dos']) {
      const piece = named(result.pieces, name)!;
      const bones = (piece.internalLinesMm ?? []).filter((l) => l.kind === 'BONE');
      expect(bones.length).toBeGreaterThan(0);
      for (const bone of bones) {
        const [top, bottom] = bone.points;
        expect(bottom!.y - top!.y).toBeGreaterThan(150);
        expect(top!.y).toBeGreaterThanOrEqual(Math.min(...piece.outlineMm.map((p) => p.y)));
      }
    }
  });

  it('cuts a channel per bone and lists the bones and the waist tape', () => {
    const channel = named(result.pieces, 'Coulisse de baleine')!;
    const notions = result.metadata.notions ?? [];
    const bones = notions.find((n) => n.label.startsWith('Baleines'))!;
    expect(channel.quantity).toBe(bones.quantity);
    // Front on the fold: centre bone once, middle bone twice; side and back pieces in pairs.
    expect(bones.quantity).toBeGreaterThanOrEqual(7);
    // The pleated ball-gown skirt hangs from a waist stay cut as a piece: it is the waist tape (not listed twice).
    expect(named(result.pieces, 'Ceinture intérieure (gros-grain)')).toBeDefined();
    expect(notions.some((n) => n.label.startsWith('Ruban de taille'))).toBe(false);
  });

  it('adds nothing without BALEINE, and a line too short for a bone is skipped', () => {
    const plain = createDefaultEngine().generate(withoutTrims(reference({ details: { manches: 'COURTES', longueur: 'SOL' } })), M);
    expect(plain.pieces.some((p) => p.internalLinesMm?.length)).toBe(false);
    expect(plain.metadata.notions).toBeUndefined();
    expect(boneLines([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 0, y: 40 }, { x: 0, y: 0 }], [0.5])).toEqual([]);
  });
});

describe('trims (berthe, sleeve frills, bead rows)', () => {
  const result = createDefaultEngine().generate(reference(), M);

  it('cuts a lace berthe along the off-the-shoulder edge, falling to a point at the centre front', () => {
    const front = named(result.pieces, 'Berthe Devant (dentelle)')!;
    const back = named(result.pieces, 'Berthe Dos (dentelle)')!;
    for (const p of [front, back]) {
      expect(closed(p.outlineMm)).toBe(true);
      expect(hasSelfIntersection(p.outlineMm)).toBe(false);
    }
    // Front: across the bustier front and its side panel (the edge runs on over it), 11 cm deep + 14 cm point.
    const bodice = named(result.pieces, 'Bustier Devant')!.outlineMm;
    expect(Math.max(...front.outlineMm.map((p) => p.x))).toBeGreaterThan(Math.max(...bodice.filter((p) => p.y < 200).map((p) => p.x)));
    expect(lowestAt0(front.outlineMm) - front.outlineMm[0]!.y).toBe(250);
    expect(lowestAt0(back.outlineMm) - back.outlineMm[0]!.y).toBe(110);
  });

  it('cuts the sleeve frills: gathered to 1.8 × the sleeve hem, one pair per tier', () => {
    const frills = result.pieces.filter((p) => p.name.startsWith('Volant de manche'));
    expect(frills.map((p) => p.name)).toEqual(['Volant de manche 1/2 (dentelle)', 'Volant de manche 2/2 (dentelle)']);
    const sleeve = named(result.pieces, 'Manche')!.outlineMm;
    const bottom = sleeve.filter((p) => p.y >= Math.max(...sleeve.map((q) => q.y)) - 1);
    const hem = Math.max(...bottom.map((p) => p.x)) - Math.min(...bottom.map((p) => p.x));
    for (const f of frills) {
      expect(f.quantity).toBe(2);
      const w = Math.max(...f.outlineMm.map((p) => p.x));
      expect(Math.abs(w - hem * FRILL_GATHER)).toBeLessThan(5);
      expect(Math.max(...f.outlineMm.map((p) => p.y))).toBe(50);
    }
  });

  it('lists the bead rows as notions: running length round the garment and bead count', () => {
    const notions = result.metadata.notions ?? [];
    const neck = notions.find((n) => n.label.includes('bord du décolleté'))!;
    const point = notions.find((n) => n.label.includes('pointe de la berthe'))!;
    // Round an off-the-shoulder neckline, from arm to arm front and back: 80 cm and more.
    expect(neck.lengthMm).toBeGreaterThan(800);
    expect(neck.quantity).toBe(Math.ceil(neck.lengthMm! / 6));
    // The berthe's V across the front: longer than the front's width (both halves), shorter than the whole neckline.
    const width = Math.max(...named(result.pieces, 'Berthe Devant')!.outlineMm.map((p) => p.x));
    expect(point.lengthMm).toBeGreaterThan(2 * width);
    expect(point.lengthMm).toBeLessThan(neck.lengthMm!);
  });

  it('works on a day dress with a round neckline, and leaves pieces alone without trims', () => {
    const params: PatternParameters = {
      garmentType: 'ROBE',
      cutType: 'EVASEE',
      style: null,
      details: { manches: 'COURTES', decollete: 'MOYEN' },
      trims: { items: [{ kind: 'BERTHE', depthMm: 80, pointMm: 0, material: 'TISSU' }, { kind: 'BEADING', place: 'MANCHES', beadMm: 4, rows: 2 }, { kind: 'BEADING', place: 'TAILLE', beadMm: 4, rows: 1 }] },
    };
    const day = createDefaultEngine().generate(params, M);
    const berthe = named(day.pieces, 'Berthe Devant (même tissu)')!;
    expect(hasSelfIntersection(berthe.outlineMm)).toBe(false);
    expect(berthe.seamAllowanceMm).toBe(10);
    expect(day.metadata.notions!.find((n) => n.label.includes('bas des manches'))!.label).toContain('2 rangs');
    expect(day.metadata.notions!.find((n) => n.label.includes('couture de taille'))!.lengthMm).toBe(780);
    const bare = withoutTrims(params);
    const pieces = RobeRule.computePieces(bare, M);
    expect(applyTrimsAndBoning(bare, pieces)).toBe(pieces);
    expect(trimNotions(bare, M, pieces)).toEqual([]);
  });

  it('helpers: the edge stops at the neck point on a shouldered neckline, a berthe band is closed', () => {
    const bodice = [{ x: 0, y: 80 }, { x: 40, y: 30 }, { x: 80, y: 0 }, { x: 200, y: 50 }, { x: 200, y: 400 }, { x: 0, y: 400 }, { x: 0, y: 80 }];
    expect(necklineEdge(bodice, false)).toEqual(bodice.slice(0, 3));
    expect(necklineEdge(bodice, true)).toEqual(bodice.slice(0, 4));
    const band = bertheBand(bodice.slice(0, 3), 50, 0);
    expect(closed(band)).toBe(true);
    expect(hasSelfIntersection(band)).toBe(false);
    expect(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBe(5);
  });
});
