import { describe, it, expect } from 'vitest';
import { PatternEngine } from '../pattern-engine';
import { JupeRule } from '../rules/jupe.rule';
import { RobeRule } from '../rules/robe.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import { VesteRule } from '../rules/veste.rule';
import { ChemiseRule } from '../rules/chemise.rule';
import { CostumeRule } from '../rules/costume.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { AutreRule } from '../rules/autre.rule';
import {
  bodiceLengthFactor,
  fitSleeve,
  resolveEaseProfile,
  resolveLengthMm,
  skirtFullnessExtraMm,
  withEase,
} from '../shared/fit';
import type { EaseLevel, GarmentType, MeasurementSet, PatternParameters, PatternPieceGeometry } from '../types';

const M: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
const GARMENTS: GarmentType[] = ['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'];
const CUTS = ['DROITE', 'AJUSTEE', 'EVASEE', 'SIRENE', 'PRINCESSE', 'OVERSIZE'];
const EASES: EaseLevel[] = ['AJUSTE', 'CONFORT', 'AMPLE'];

function engine(): PatternEngine {
  const e = new PatternEngine();
  [RobeRule, JupeRule, PantalonRule, VesteRule, ChemiseRule, CostumeRule, RobeMarieeRule, AutreRule].forEach((r) =>
    e.registerRule(r),
  );
  return e;
}
const gen = (p: Partial<PatternParameters> & { garmentType: GarmentType }, m: MeasurementSet = M) =>
  engine().generate({ cutType: 'DROITE', style: null, details: {}, ...p }, m);

const width = (pieces: PatternPieceGeometry[]) =>
  pieces.reduce((s, piece) => s + Math.max(...piece.outlineMm.map((pt) => pt.x)) - Math.min(...piece.outlineMm.map((pt) => pt.x)), 0);
const height = (piece: PatternPieceGeometry) =>
  Math.max(...piece.outlineMm.map((pt) => pt.y)) - Math.min(...piece.outlineMm.map((pt) => pt.y));
const piece = (pieces: PatternPieceGeometry[], name: string) => pieces.find((p) => p.name.startsWith(name))!;

describe('shared/fit helpers', () => {
  it('CONFORT is the neutral ease and the others bracket it', () => {
    expect(resolveEaseProfile('CONFORT')).toEqual({ bustDeltaMm: 0, waistDeltaMm: 0, hipDeltaMm: 0, armholeDeltaMm: 0 });
    expect(resolveEaseProfile(undefined)).toEqual(resolveEaseProfile('CONFORT'));
    expect(resolveEaseProfile('AJUSTE').bustDeltaMm).toBeLessThan(0);
    expect(resolveEaseProfile('AMPLE').bustDeltaMm).toBeGreaterThan(0);
  });

  it('composes with the cut: delta_final = cut.delta + ease.delta', () => {
    const cut = { bodiceDeltaMm: -10, waistDeltaMm: -10, hipDeltaMm: -5, hemFlareMm: 300, fishtail: true };
    expect(withEase(cut, 'AMPLE')).toEqual({ ...cut, bodiceDeltaMm: 20, waistDeltaMm: 15, hipDeltaMm: 25 });
    expect(withEase(cut, 'CONFORT')).toBe(cut);
  });

  it('resolveLengthMm scales, bounds and is neutral at 100 %', () => {
    expect(resolveLengthMm(700, undefined)).toBe(700);
    expect(resolveLengthMm(700, 100)).toBe(700);
    expect(resolveLengthMm(700, 50)).toBe(350);
    expect(resolveLengthMm(700, 50, [400, 900])).toBe(400);
    expect(resolveLengthMm(700, 130, [400, 900])).toBe(900);
  });

  it('skirt fullness adds nothing at 1 or when absent, and grows with the ratio', () => {
    expect(skirtFullnessExtraMm(undefined, 300)).toBe(0);
    expect(skirtFullnessExtraMm({ skirt: 1 }, 300)).toBe(0);
    expect(skirtFullnessExtraMm({ skirt: 2 }, 300)).toBe(300);
    expect(skirtFullnessExtraMm({ skirt: 3 }, 300)).toBe(600);
  });

  it('fitSleeve: 0 % removes the sleeve, pct scales, fullness widens the top', () => {
    const s = { lengthMm: 500, cuffRatio: 0.7, topRatio: 1 };
    expect(fitSleeve(s, {})).toEqual(s);
    expect(fitSleeve(s, { lengths: { sleevePct: 0 } })).toBeNull();
    expect(fitSleeve(s, { lengths: { sleevePct: 50 } })?.lengthMm).toBe(250);
    expect(fitSleeve(s, { fullness: { sleeve: 2 } })?.topRatio).toBe(2);
    expect(fitSleeve(null, { lengths: { sleevePct: 50 } })).toBeNull();
  });

  it('bodiceLengthFactor', () => {
    expect(bodiceLengthFactor(undefined)).toBe(1);
    expect(bodiceLengthFactor({ bodicePct: 90 })).toBeCloseTo(0.9);
  });
});

describe('ease changes the contours (monotonic)', () => {
  it.each(['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'] as GarmentType[])(
    '%s: AJUSTE < CONFORT < AMPLE in total width',
    (garmentType) => {
      const [a, c, l] = EASES.map((ease) => width(gen({ garmentType, ease }).pieces));
      expect(a!).toBeLessThan(c!);
      expect(c!).toBeLessThan(l!);
    },
  );
});

describe('guard-rails: every garment × cut × ease yields sound pieces', () => {
  for (const garmentType of GARMENTS) {
    it(`${garmentType}`, () => {
      for (const cutType of CUTS) {
        for (const ease of EASES) {
          const result = gen({ garmentType, cutType, ease, fullness: { skirt: 3, sleeve: 2 }, lengths: { skirtPct: 60, bodicePct: 90 } });
          expect(result.warnings, `${garmentType}/${cutType}/${ease}`).toEqual([]);
          expect(result.pieces.length).toBeGreaterThan(0);
        }
      }
    });
  }
});

describe('skirt: length, fullness and measured length', () => {
  it('lengths.skirtPct shortens the skirt', () => {
    const full = height(piece(gen({ garmentType: 'JUPE' }).pieces, 'Devant'));
    const short = height(piece(gen({ garmentType: 'JUPE', lengths: { skirtPct: 80 } }).pieces, 'Devant'));
    expect(short).toBeCloseTo(full * 0.8, -1);
  });

  it('fullness.skirt widens the hem', () => {
    const base = width(gen({ garmentType: 'JUPE' }).pieces);
    const w2 = width(gen({ garmentType: 'JUPE', fullness: { skirt: 2 } }).pieces);
    const w3 = width(gen({ garmentType: 'JUPE', fullness: { skirt: 3 } }).pieces);
    expect(w2).toBeGreaterThan(base);
    expect(w3).toBeGreaterThan(w2);
    expect(width(gen({ garmentType: 'JUPE', fullness: { skirt: 1 } }).pieces)).toBe(base);
  });

  it('LONGUEUR_JUPE wins over the wizard label; skirtPct applies on top', () => {
    const d = (m: MeasurementSet, extra: Partial<PatternParameters> = {}) =>
      height(piece(gen({ garmentType: 'JUPE', details: { longueur: 'MAXI' }, ...extra }, { ...M, ...m }).pieces, 'Devant'));
    expect(d({ LONGUEUR_JUPE: 60 })).toBe(600);
    expect(d({ LONGUEUR_JUPE: 60 }, { lengths: { skirtPct: 50 } })).toBe(300);
    expect(d({})).toBe(950);
  });

  it('HAUTEUR_BASSIN moves the hip line of the skirt', () => {
    const hipY = (m: MeasurementSet) => piece(gen({ garmentType: 'JUPE' }, { ...M, ...m }).pieces, 'Devant').outlineMm[2]!.y;
    expect(hipY({})).toBe(200);
    expect(hipY({ HAUTEUR_BASSIN: 24 })).toBe(240);
  });

  it('ROBE and ROBE_MARIEE honour LONGUEUR_JUPE / HAUTEUR_TAILLE_SOL', () => {
    expect(height(piece(gen({ garmentType: 'ROBE' }, { ...M, LONGUEUR_JUPE: 80 }).pieces, 'Jupe Devant'))).toBe(800);
    const mariee = gen({ garmentType: 'ROBE_MARIEE' }, { ...M, HAUTEUR_TAILLE_SOL: 105 });
    expect(height(piece(mariee.pieces, 'Jupe Devant'))).toBe(1050);
  });
});

describe('bodice, sleeves and body measurements', () => {
  it('LONGUEUR_DEVANT drives the dress front bodice height; bodicePct scales it', () => {
    const h = (m: MeasurementSet, extra: Partial<PatternParameters> = {}) =>
      height(piece(gen({ garmentType: 'ROBE', ...extra }, { ...M, ...m }).pieces, 'Corsage Devant'));
    expect(h({})).toBe(460);
    expect(h({ LONGUEUR_DEVANT: 45 })).toBe(450);
    expect(h({ LONGUEUR_DEVANT: 45 }, { lengths: { bodicePct: 80 } })).toBe(360);
  });

  it('bodicePct shortens jackets and shirts', () => {
    for (const garmentType of ['VESTE', 'CHEMISE'] as GarmentType[]) {
      const tall = height(gen({ garmentType }).pieces[0]!);
      const short = height(gen({ garmentType, lengths: { bodicePct: 80 } }).pieces[0]!);
      expect(short).toBeLessThan(tall);
    }
  });

  it('sleevePct 0 removes the sleeve piece, fullness.sleeve widens it', () => {
    const base = gen({ garmentType: 'ROBE', details: { manches: 'LONGUES' } }, { ...M, LONGUEUR_BRAS: 60 });
    expect(base.pieces.some((p) => p.name === 'Manche')).toBe(true);
    const none = gen({ garmentType: 'ROBE', details: { manches: 'LONGUES' }, lengths: { sleevePct: 0 } }, { ...M, LONGUEUR_BRAS: 60 });
    expect(none.pieces.some((p) => p.name === 'Manche')).toBe(false);
    const wide = gen({ garmentType: 'ROBE', details: { manches: 'LONGUES' }, fullness: { sleeve: 2 } }, { ...M, LONGUEUR_BRAS: 60 });
    expect(width([piece(wide.pieces, 'Manche')])).toBeGreaterThan(width([piece(base.pieces, 'Manche')]));
    const half = gen({ garmentType: 'ROBE', details: { manches: 'LONGUES' }, lengths: { sleevePct: 50 } }, { ...M, LONGUEUR_BRAS: 60 });
    expect(height(piece(half.pieces, 'Manche'))).toBeLessThan(height(piece(base.pieces, 'Manche')));
  });

  it('HAUTEUR_FOURCHE sets the trouser crotch height', () => {
    const crotchY = (m: MeasurementSet) =>
      piece(gen({ garmentType: 'PANTALON' }, { ...M, ...m }).pieces, 'Devant').outlineMm[7]!.y;
    expect(crotchY({ HAUTEUR_FOURCHE: 29 })).toBe(290);
    expect(crotchY({})).not.toBe(290);
  });
});
