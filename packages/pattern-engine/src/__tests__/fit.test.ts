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
  floorQuarters,
  hipGirthCm,
  bustDartIntakeMm,
  MIN_WEARING_EASE_MM,
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

  it('fitSleeve: 0 % removes the sleeve, pct is a share of the arm, fullness widens the top', () => {
    const s = { lengthMm: 500, cuffRatio: 0.7, topRatio: 1 };
    expect(fitSleeve(s, {})).toEqual(s);
    expect(fitSleeve(s, { lengths: { sleevePct: 0 } })).toBeNull();
    expect(fitSleeve(s, { lengths: { sleevePct: 50 } })?.lengthMm).toBe(295); // half of a 59 cm arm
    expect(fitSleeve({ ...s, lengthMm: 200 }, { lengths: { sleevePct: 25 } }, 600)?.lengthMm).toBe(150);
    expect(fitSleeve(s, { fullness: { sleeve: 2 } })?.topRatio).toBe(2);
    expect(fitSleeve(null, { lengths: { sleevePct: 50 } })).toBeNull();
  });

  it('bodiceLengthFactor', () => {
    expect(bodiceLengthFactor(undefined)).toBe(1);
    expect(bodiceLengthFactor({ bodicePct: 90 })).toBeCloseTo(0.9);
  });
});

describe('ease changes the contours (monotonic)', () => {
  // In stretch cloth: a woven dress is never cut under the body (MIN_WEARING_EASE_MM), so AJUSTE meets CONFORT there.
  it.each(['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'] as GarmentType[])(
    '%s: AJUSTE < CONFORT < AMPLE in total width',
    (garmentType) => {
      const [a, c, l] = EASES.map((ease) => width(gen({ garmentType, ease, fabric: 'STRETCH' }).pieces));
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
          // AUTRE always carries its intentional "generic base block" caveat; nothing else may appear.
          // Extreme fullness can legitimately need a wider fabric: that warning is expected, any other is not.
          const unexpected = result.warnings.filter((w) => !w.includes('générique') && !w.includes('laize'));
          expect(unexpected, `${garmentType}/${cutType}/${ease}`).toEqual([]);
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
    // Cut a little longer than the waist-to-floor height: the skirt goes over the petticoat (robe-mariee.rule.ts).
    const cut = height(piece(mariee.pieces, 'Jupe Devant'));
    expect(cut).toBeGreaterThanOrEqual(1050);
    expect(cut).toBeLessThan(1050 * 1.03);
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

const FULL_BODY: MeasurementSet = {
  ...M,
  TOUR_SOUS_POITRINE: 76,
  HAUTEUR_POITRINE: 26,
  ECARTEMENT_POINTS_POITRINE: 19,
  CARRURE_DEVANT: 34,
  CARRURE_DOS: 36,
  LARGEUR_EPAULE: 12,
  PROFONDEUR_EMMANCHURE: 21,
  TOUR_EMMANCHURE: 42,
  TOUR_BRAS: 29,
  TOUR_POIGNET: 16,
  TOUR_COU: 36,
  LONGUEUR_BRAS: 60,
  TOUR_CUISSE: 58,
  TOUR_GENOU: 38,
  TOUR_CHEVILLE: 23,
  HAUTEUR_FOURCHE: 27,
  HAUTEUR_ENTREJAMBE: 78,
  HAUTEUR_BASSIN: 20,
};

describe('torso measurements: shoulders, armhole and bust dart', () => {
  const front = (garmentType: GarmentType, m: MeasurementSet, name: string) =>
    piece(gen({ garmentType, details: { manches: 'LONGUES' } }, { ...M, ...m }).pieces, name);

  it.each([
    ['VESTE', 'Devant Veste'],
    ['CHEMISE', 'Devant Chemise'],
    ['COSTUME', 'Devant Veste'],
    ['ROBE', 'Corsage Devant'],
  ] as Array<[GarmentType, string]>)('%s: a narrower carrure pulls the shoulder tip in', (garment, name) => {
    const base = front(garment, {}, name).outlineMm[2]!.x;
    const narrow = front(garment, { CARRURE_DEVANT: 28 }, name).outlineMm[2]!.x;
    expect(narrow).toBeLessThan(base);
    expect(front(garment, { CARRURE_DEVANT: 28 }, name).outlineMm[2]!.x).toBe(Math.max(140, narrow));
  });

  it('LARGEUR_EPAULE is used when no carrure is given, and never closer than 4 cm to the neck', () => {
    const tip = (m: MeasurementSet) => front('VESTE', m, 'Devant Veste').outlineMm[2]!.x;
    expect(tip({ LARGEUR_EPAULE: 12 })).toBeLessThan(tip({}));
    const neck = front('VESTE', {}, 'Devant Veste').outlineMm[1]!.x;
    expect(tip({ LARGEUR_EPAULE: 0.1 })).toBeGreaterThanOrEqual(neck + 40);
  });

  it('PENTE_EPAULE sets the shoulder drop: square shoulders higher, sloping ones lower (back a little less)', () => {
    const drop = (m: MeasurementSet, name = 'Devant Veste') => {
      const o = piece(gen({ garmentType: 'VESTE', details: { manches: 'LONGUES' } }, { ...M, ...m }).pieces, name).outlineMm;
      return o[2]!.y - o[1]!.y;
    };
    expect(drop({ PENTE_EPAULE: 3 })).toBeLessThan(drop({ PENTE_EPAULE: 6.5 }));
    expect(drop({ PENTE_EPAULE: 6.5 }, 'Dos Veste')).toBeLessThan(drop({ PENTE_EPAULE: 6.5 }));
    // Bounded: never flat, never a cliff.
    expect(drop({ PENTE_EPAULE: 0.1 })).toBeGreaterThanOrEqual(15);
    expect(drop({ PENTE_EPAULE: 30 })).toBeLessThanOrEqual(90);
  });

  it('PROFONDEUR_EMMANCHURE moves the underarm point', () => {
    const y = (m: MeasurementSet) => front('VESTE', m, 'Devant Veste').outlineMm[3]!.y;
    expect(y({})).toBe(240);
    expect(y({ PROFONDEUR_EMMANCHURE: 19 })).toBe(210);
    expect(y({ PROFONDEUR_EMMANCHURE: 1 })).toBeGreaterThanOrEqual(135); // clamped, never degenerate
  });

  it('adds a bust dart only when the cup difference is real, at the measured height', () => {
    const count = (m: MeasurementSet) => front('VESTE', m, 'Devant Veste').outlineMm.length;
    const base = count({});
    expect(count({ TOUR_SOUS_POITRINE: 82 })).toBe(base); // 10 cm difference: no dart
    expect(count({ TOUR_SOUS_POITRINE: 76 })).toBe(base + 3);
    const outline = front('VESTE', { TOUR_SOUS_POITRINE: 76, HAUTEUR_POITRINE: 30, ECARTEMENT_POINTS_POITRINE: 20 }, 'Devant Veste').outlineMm;
    const apex = outline.find((p) => p.x === 100)!;
    expect(apex).toBeDefined();
    expect(apex.y).toBeGreaterThanOrEqual(240);
  });

  it('a larger cup difference makes a deeper dart', () => {
    const depth = (sous: number) => {
      const o = front('CHEMISE', { TOUR_SOUS_POITRINE: sous }, 'Devant Chemise').outlineMm;
      const i = o.findIndex((p, k) => k > 3 && o[k - 1]!.x > p.x && o[k + 1]!.x > p.x);
      return o[i - 1]!.x - o[i]!.x;
    };
    expect(depth(70)).toBeGreaterThan(depth(78));
  });

  it('the wedding bustier gets the same dart; the dress back never does', () => {
    const base = piece(gen({ garmentType: 'ROBE_MARIEE' }).pieces, 'Bustier Devant').outlineMm.length;
    const withDart = piece(gen({ garmentType: 'ROBE_MARIEE' }, { ...M, TOUR_SOUS_POITRINE: 74 }).pieces, 'Bustier Devant').outlineMm.length;
    expect(withDart).toBe(base + 3);
    const back = (m: MeasurementSet) => piece(gen({ garmentType: 'ROBE' }, { ...M, ...m }).pieces, 'Corsage Dos').outlineMm.length;
    expect(back({ TOUR_SOUS_POITRINE: 70 })).toBe(back({}));
  });
});

describe('arm and neck measurements', () => {
  const sleeveW = (garmentType: GarmentType, m: MeasurementSet, name: string) =>
    width([piece(gen({ garmentType, details: { manches: 'LONGUES' } }, { ...M, LONGUEUR_BRAS: 60, ...m }).pieces, name)]);

  it.each([
    ['VESTE', 'Manche Veste'],
    ['CHEMISE', 'Manche Chemise'],
    ['COSTUME', 'Manche Veste'],
    ['ROBE', 'Manche'],
  ] as Array<[GarmentType, string]>)('%s: the sleeve is never narrower than the arm', (garment, name) => {
    const tiny = sleeveW(garment, { TOUR_BRAS: 20 }, name);
    const big = sleeveW(garment, { TOUR_BRAS: 40 }, name);
    expect(big).toBeGreaterThanOrEqual(400 + 60);
    expect(big).toBeGreaterThan(tiny);
  });

  it('TOUR_POIGNET keeps the cuff above the wrist; TOUR_EMMANCHURE raises the cap', () => {
    const p = (m: MeasurementSet) => piece(gen({ garmentType: 'VESTE', details: { manches: 'LONGUES' } }, { ...M, LONGUEUR_BRAS: 60, ...m }).pieces, 'Manche Veste').outlineMm;
    const cuff = (m: MeasurementSet) => {
      const o = p(m);
      return o[o.length - 3]!.x - o[o.length - 2]!.x;
    };
    expect(cuff({ TOUR_POIGNET: 20 })).toBeGreaterThanOrEqual(230);
    expect(p({ TOUR_EMMANCHURE: 54 })[0]!.y).toBeGreaterThan(p({ TOUR_EMMANCHURE: 36 })[0]!.y);
    expect(Math.min(...p({ TOUR_EMMANCHURE: 54 }).map((q) => q.y))).toBe(0);
  });

  it('TOUR_COU sets the collar length', () => {
    const len = (garmentType: GarmentType, name: string, cou: number) =>
      Math.max(...piece(gen({ garmentType }, { ...M, TOUR_COU: cou }).pieces, name).outlineMm.map((p) => p.x));
    expect(len('CHEMISE', 'Col', 38)).toBe(400);
    expect(len('VESTE', 'Col Tailleur', 40)).toBe(420);
    expect(len('COSTUME', 'Col Tailleur', 36)).toBe(380);
  });
});

describe('leg measurements', () => {
  const leg = (m: MeasurementSet, garmentType: GarmentType = 'PANTALON') =>
    piece(gen({ garmentType }, { ...M, LONGUEUR_JAMBE: 100, ...m }).pieces, garmentType === 'PANTALON' ? 'Devant Pantalon' : 'Devant Pantalon');

  it.each(['PANTALON', 'COSTUME'] as GarmentType[])('%s: ankle and knee girths set the minimum widths', (garment) => {
    const hem = (m: MeasurementSet) => {
      const o = leg(m, garment).outlineMm;
      return Math.abs(o[4]!.x - o[5]!.x);
    };
    expect(hem({})).toBeLessThan(hem({ TOUR_CHEVILLE: 40 }));
    const knee = (m: MeasurementSet) => {
      const o = leg(m, garment).outlineMm;
      return Math.abs(o[3]!.x - o[6]!.x);
    };
    expect(knee({})).toBeLessThan(knee({ TOUR_GENOU: 60 }));
  });

  it('TOUR_CUISSE widens the hip line only when the thigh would be too tight', () => {
    const hip = (m: MeasurementSet) => leg(m).outlineMm[2]!.x;
    expect(hip({ TOUR_CUISSE: 40 })).toBe(hip({}));
    expect(hip({ TOUR_CUISSE: 75 })).toBeGreaterThan(hip({}));
  });

  it('HAUTEUR_ENTREJAMBE gives the length when no outer leg length is measured', () => {
    const length = (m: MeasurementSet, garment: GarmentType) => {
      const { LONGUEUR_JAMBE: _omit, ...rest } = { ...M, ...m } as MeasurementSet;
      void _omit;
      const o = piece(gen({ garmentType: garment }, rest).pieces, 'Devant Pantalon').outlineMm;
      return Math.max(...o.map((p) => p.y));
    };
    for (const garment of ['PANTALON', 'COSTUME'] as GarmentType[]) {
      expect(length({ HAUTEUR_FOURCHE: 27, HAUTEUR_ENTREJAMBE: 78 }, garment)).toBe(270 + 780);
      expect(length({}, garment)).toBe(1000);
    }
  });
});

describe('a fully measured body', () => {
  it.each(GARMENTS)('%s: every measurement together gives sound pieces for every cut and ease', (garmentType) => {
    for (const cutType of CUTS) {
      for (const ease of EASES) {
        const result = gen({ garmentType, cutType, ease, details: { manches: 'LONGUES' } }, FULL_BODY);
        expect(result.warnings.filter((w) => !w.includes('générique') && !w.includes('laize')), `${garmentType}/${cutType}/${ease}`).toEqual([]);
        for (const p of result.pieces) expect(p.outlineMm.every((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y))).toBe(true);
      }
    }
  });
});

describe('wearing ease of a woven dress (MIN_WEARING_EASE_MM)', () => {
  it('floorQuarters widens front and back alike, only when the round is short, never for stretch cloth', () => {
    expect(floorQuarters(200, 180, 740, 20, undefined)).toEqual([200, 180]); // 760 ≥ 760
    expect(floorQuarters(175, 145, 740, 20, 'STRUCTURE')).toEqual([205, 175]); // 640 → 760
    expect(floorQuarters(175, 145, 740, 20, 'STRETCH')).toEqual([175, 145]);
  });

  const dress = (parameters: Partial<PatternParameters>) =>
    gen({ garmentType: 'ROBE', ...parameters }).pieces;
  const quarterAt = (pieces: PatternPieceGeometry[], name: string, y: number): number => {
    const piece = pieces.find((p) => p.name === name)!;
    const xs: number[] = [];
    const o = piece.outlineMm;
    for (let i = 0; i < o.length; i += 1) {
      const a = o[i]!;
      const b = o[(i + 1) % o.length]!;
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
    }
    return Math.max(...xs) - Math.min(...xs);
  };

  it('a PRINCESSE dress made AJUSTE is no smaller than the body at the bust, the waist and the hips', () => {
    const pieces = dress({ cutType: 'PRINCESSE', ease: 'AJUSTE', details: { longueur: 'SOL' } });
    const front = pieces.find((p) => p.name === 'Corsage Devant')!;
    const height = Math.max(...front.outlineMm.map((p) => p.y));
    const backHeight = Math.max(...pieces.find((p) => p.name === 'Corsage Dos')!.outlineMm.map((p) => p.y));
    const waist = 2 * (quarterAt(pieces, 'Corsage Devant', height - 1) + quarterAt(pieces, 'Corsage Dos', backHeight - 1));
    expect(waist).toBeGreaterThanOrEqual(M.TOUR_TAILLE! * 10);
    const hip = 2 * (quarterAt(pieces, 'Jupe Devant', 200) + quarterAt(pieces, 'Jupe Dos', 200));
    expect(hip).toBeGreaterThanOrEqual(M.TOUR_BASSIN! * 10 + MIN_WEARING_EASE_MM.hip);
  });

  it('the A-line of a flared princess skirt stands off the hips: an A from the waist, not a mermaid', () => {
    const pieces = dress({ cutType: 'PRINCESSE', ease: 'AJUSTE', details: { longueur: 'SOL' }, fullness: { skirt: 3.25 } });
    const hip = 2 * (quarterAt(pieces, 'Jupe Devant', 200) + quarterAt(pieces, 'Jupe Dos', 200));
    // Several centimetres over the hips (the side seam runs straight from the waist to the wide hem).
    expect(hip - M.TOUR_BASSIN! * 10).toBeGreaterThan(60);
  });

  it('DROITE + CONFORT is unchanged: its own ease is the floor', () => {
    const plain = dress({ cutType: 'DROITE', details: {} });
    const woven = dress({ cutType: 'DROITE', details: {}, fabric: 'STRUCTURE' });
    const stretch = dress({ cutType: 'DROITE', details: {}, fabric: 'STRETCH' });
    expect(woven).toEqual(plain);
    expect(stretch).toEqual(plain);
  });
});

describe('hipGirthCm', () => {
  it('takes the full hip when the belly makes it larger, the hip otherwise', () => {
    expect(hipGirthCm({ TOUR_BASSIN: 98 })).toBe(98);
    expect(hipGirthCm({ TOUR_BASSIN: 98, TOUR_HANCHE_COMPLET: 104 })).toBe(104);
    expect(hipGirthCm({ TOUR_BASSIN: 98, TOUR_HANCHE_COMPLET: 96 })).toBe(98);
    expect(hipGirthCm({})).toBe(95);
  });

  it('a skirt cut for a prominent belly is wider at the hip', () => {
    const base = { TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
    const width = (m: Record<string, number>): number => {
      const front = JupeRule.computePieces({ cutType: 'DROITE', details: {} } as PatternParameters, m)[0]!;
      const xs = front.outlineMm.map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width({ ...base, TOUR_HANCHE_COMPLET: 106 })).toBeGreaterThan(width(base));
  });
});

describe('bustDartIntakeMm', () => {
  it('reads the cup from the high bust first, the underbust otherwise', () => {
    expect(bustDartIntakeMm({ TOUR_POITRINE: 92 })).toBeUndefined();
    expect(bustDartIntakeMm({ TOUR_POITRINE: 92, TOUR_HAUT_POITRINE: 89.5 })).toBe(0); // B cup: the block's own
    expect(bustDartIntakeMm({ TOUR_POITRINE: 98, TOUR_HAUT_POITRINE: 90 })).toBe(60); // capped
    expect(bustDartIntakeMm({ TOUR_POITRINE: 94, TOUR_HAUT_POITRINE: 90 })).toBe(18);
    expect(bustDartIntakeMm({ TOUR_POITRINE: 94, TOUR_HAUT_POITRINE: 90, TOUR_SOUS_POITRINE: 70 })).toBe(18);
    expect(bustDartIntakeMm({ TOUR_POITRINE: 92, TOUR_SOUS_POITRINE: 74 })).toBe(30);
  });
});
