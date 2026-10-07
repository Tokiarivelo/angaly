import { describe, expect, it } from 'vitest';
import { ChemiseRule } from '../rules/chemise.rule';
import { CostumeRule } from '../rules/costume.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { VesteRule } from '../rules/veste.rule';
import type { GarmentType, IPatternRule, PatternParameters, PatternPieceGeometry } from '../types';
import {
  resolveLegProfile,
  resolveTopAdjustments,
  resolveTopLengthFactor,
  resolveTrouserLengthFactor,
} from '../shared/cut-profile';

const measurements = {
  TOUR_POITRINE: 92,
  TOUR_TAILLE: 74,
  TOUR_BASSIN: 98,
  LONGUEUR_DOS: 41,
  LONGUEUR_BRAS: 60,
  LONGUEUR_JAMBE: 100,
};
const CUTS = ['DROITE', 'EVASEE', 'SIRENE', 'PRINCESSE', 'AJUSTEE', 'OVERSIZE'];

const make = (
  rule: IPatternRule,
  garmentType: GarmentType,
  cutType: string,
  details: Record<string, string> = {},
): PatternPieceGeometry[] =>
  rule.computePieces({ garmentType, cutType, style: null, details } as PatternParameters, measurements);

const find = (pieces: PatternPieceGeometry[], part: string) => pieces.find((p) => p.name.includes(part));
const maxOf = (piece: PatternPieceGeometry | undefined, axis: 'x' | 'y') =>
  Math.max(...(piece?.outlineMm ?? [{ x: 0, y: 0 }]).map((p) => p[axis]));

const GARMENTS: Array<[string, IPatternRule, GarmentType]> = [
  ['CHEMISE', ChemiseRule, 'CHEMISE'],
  ['VESTE', VesteRule, 'VESTE'],
  ['COSTUME', CostumeRule, 'COSTUME'],
  ['PANTALON', PantalonRule, 'PANTALON'],
  ['ROBE_MARIEE', RobeMarieeRule, 'ROBE_MARIEE'],
];

describe.each(GARMENTS)('%s follows the chosen cut', (_name, rule, type) => {
  it('produces a different set of pieces for every cut', () => {
    const outlines = new Set(CUTS.map((c) => JSON.stringify(make(rule, type, c))));
    expect(outlines.size).toBe(CUTS.length);
  });

  it('keeps every outline closed and finite, whatever the cut', () => {
    for (const cut of CUTS) {
      for (const piece of make(rule, type, cut, { manches: 'BALLON', longueur: 'MIDI' })) {
        expect(piece.outlineMm[0]).toEqual(piece.outlineMm[piece.outlineMm.length - 1]);
        expect(piece.outlineMm.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      }
    }
  });

  it('treats an unknown cut like DROITE (historical geometry)', () => {
    expect(make(rule, type, 'INCONNUE')).toEqual(make(rule, type, 'DROITE'));
  });
});

describe('tops (chemise, veste, costume jacket)', () => {
  const front = (rule: IPatternRule, type: GarmentType, cut: string, details = {}) =>
    find(make(rule, type, cut, details), 'Devant')!;

  it.each([
    ['CHEMISE', ChemiseRule],
    ['VESTE', VesteRule],
    ['COSTUME', CostumeRule],
  ] as Array<[GarmentType, IPatternRule]>)('%s: oversize is wider than ajustée at the chest', (type, rule) => {
    expect(maxOf(front(rule, type, 'OVERSIZE'), 'x')).toBeGreaterThan(maxOf(front(rule, type, 'AJUSTEE'), 'x'));
  });

  it.each([
    ['CHEMISE', ChemiseRule],
    ['VESTE', VesteRule],
    ['COSTUME', CostumeRule],
  ] as Array<[GarmentType, IPatternRule]>)('%s: longueur and neckline details change the front piece', (type, rule) => {
    expect(maxOf(front(rule, type, 'DROITE', { longueur: 'MINI' }), 'y')).toBeLessThan(
      maxOf(front(rule, type, 'DROITE', { longueur: 'MAXI' }), 'y'),
    );
    expect(front(rule, type, 'DROITE', { decollete: 'PLONGEANT' }).outlineMm[0]!.y).toBeGreaterThan(
      front(rule, type, 'DROITE').outlineMm[0]!.y,
    );
  });

  it('drops sleeves and cuffs when sleeveless, and the cuff for short sleeves', () => {
    const names = (details: Record<string, string>) => make(ChemiseRule, 'CHEMISE', 'DROITE', details).map((p) => p.name);
    expect(names({})).toEqual(expect.arrayContaining(['Manche Chemise', 'Poignet', 'Col & Pied de col']));
    expect(names({ manches: 'SANS_MANCHES' })).not.toContain('Manche Chemise');
    expect(names({ manches: 'SANS_MANCHES' })).not.toContain('Poignet');
    expect(names({ manches: 'COURTES' })).toContain('Manche Chemise');
    expect(names({ manches: 'COURTES' })).not.toContain('Poignet');
    expect(names({ manches: 'LONGUES' })).toContain('Poignet');
  });

  it('removes the collar piece for collarless necklines and keeps it otherwise', () => {
    const hasCollar = (rule: IPatternRule, type: GarmentType, details: Record<string, string>) =>
      make(rule, type, 'DROITE', details).some((p) => p.name.startsWith('Col'));
    for (const [rule, type] of [[VesteRule, 'VESTE'], [CostumeRule, 'COSTUME'], [ChemiseRule, 'CHEMISE']] as Array<[IPatternRule, GarmentType]>) {
      expect(hasCollar(rule, type, {})).toBe(true);
      expect(hasCollar(rule, type, { col: 'ROND' })).toBe(false);
      expect(hasCollar(rule, type, { col: 'OFFICIER' })).toBe(true);
    }
  });

  it('lengthens the sleeve piece for long sleeves compared with short ones', () => {
    const sleeve = (manches: string) => maxOf(find(make(VesteRule, 'VESTE', 'DROITE', { manches }), 'Manche'), 'y');
    expect(sleeve('COURTES')).toBeLessThan(sleeve('LONGUES'));
  });
});

describe('pantalon and costume trousers', () => {
  const legs = (rule: IPatternRule, type: GarmentType, cut: string, details = {}) =>
    find(make(rule, type, cut, details), 'Devant Pantalon')!;
  const hemWidth = (piece: PatternPieceGeometry) => {
    const bottom = piece.outlineMm.filter((p) => p.y === maxOf(piece, 'y'));
    return Math.max(...bottom.map((p) => p.x)) - Math.min(...bottom.map((p) => p.x));
  };

  it.each([
    ['PANTALON', PantalonRule],
    ['COSTUME', CostumeRule],
  ] as Array<[GarmentType, IPatternRule]>)('%s: slim < straight < flared < oversize leg openings', (type, rule) => {
    const w = (cut: string) => hemWidth(legs(rule, type, cut));
    expect(w('AJUSTEE')).toBeLessThan(w('DROITE'));
    expect(w('DROITE')).toBeLessThan(w('EVASEE'));
    expect(w('EVASEE')).toBeLessThan(w('OVERSIZE'));
  });

  it('keeps the historical SLIM / PALAZZO keywords working', () => {
    expect(resolveLegProfile('slim').halfHemMm).toBe(80);
    expect(resolveLegProfile('PALAZZO').halfHemMm).toBe(140);
    expect(resolveLegProfile(undefined).halfHemMm).toBe(100);
  });

  it('shortens trousers for mini/midi and flares the leg below the knee for EVASEE', () => {
    expect(maxOf(legs(PantalonRule, 'PANTALON', 'DROITE', { longueur: 'MINI' }), 'y')).toBeLessThan(
      maxOf(legs(PantalonRule, 'PANTALON', 'DROITE', { longueur: 'MAXI' }), 'y'),
    );
    const piece = legs(PantalonRule, 'PANTALON', 'EVASEE');
    const knee = piece.outlineMm[3]!; // right knee point
    const hem = piece.outlineMm[4]!; // right hem point
    expect(hem.x - piece.grainline.originX).toBeGreaterThan(knee.x - piece.grainline.originX);
  });
});

describe('robe de mariée', () => {
  const skirt = (cut: string, details = {}) => find(make(RobeMarieeRule, 'ROBE_MARIEE', cut, details), 'Jupe Devant')!;

  it('flares the skirt more for PRINCESSE than for DROITE and adds a knee point for SIRENE', () => {
    expect(maxOf(skirt('PRINCESSE'), 'x')).toBeGreaterThan(maxOf(skirt('DROITE'), 'x'));
    expect(skirt('SIRENE').outlineMm.length).toBe(skirt('DROITE').outlineMm.length + 1);
  });

  it('follows the length and sleeve details', () => {
    expect(maxOf(skirt('DROITE', { longueur: 'MIDI' }), 'y')).toBeLessThan(maxOf(skirt('DROITE'), 'y'));
    expect(make(RobeMarieeRule, 'ROBE_MARIEE', 'DROITE').some((p) => p.name === 'Manche')).toBe(false);
    expect(make(RobeMarieeRule, 'ROBE_MARIEE', 'DROITE', { manches: 'LONGUES' }).some((p) => p.name === 'Manche')).toBe(true);
  });
});

describe('cut-profile helpers for tops and trousers', () => {
  it('uses neutral values when nothing is chosen', () => {
    const adj = resolveTopAdjustments({ cutType: 'DROITE', details: {} }, 600);
    expect(adj).toMatchObject({
      bodiceDeltaMm: 0,
      waistDeltaMm: 0,
      hemDeltaMm: 0,
      lengthFactor: 1,
      neckline: null,
      sleeve: null,
      sleeveless: false,
      includeCollar: true,
      includeCuff: true,
    });
  });

  it('maps length factors, ignoring unknown values', () => {
    expect(resolveTopLengthFactor('MINI')).toBeLessThan(1);
    expect(resolveTopLengthFactor('???')).toBe(1);
    expect(resolveTrouserLengthFactor('MIDI')).toBeLessThan(1);
    expect(resolveTrouserLengthFactor(undefined)).toBe(1);
  });

  it('passes the rule default arm length through for long sleeves', () => {
    expect(resolveTopAdjustments({ cutType: 'DROITE', details: { manches: 'LONGUES' } }, 612).sleeve?.lengthMm).toBe(612);
  });
});
