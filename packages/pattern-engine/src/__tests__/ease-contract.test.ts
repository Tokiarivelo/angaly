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
import type { GarmentType, PatternParameters, MeasurementSet } from '../types';

const MEASUREMENTS: MeasurementSet = {
  TOUR_POITRINE: 92,
  TOUR_TAILLE: 74,
  TOUR_BASSIN: 98,
  LONGUEUR_DOS: 42,
  TOUR_SOUS_POITRINE: 78,
  HAUTEUR_POITRINE: 26,
  CARRURE_DEVANT: 36,
};

const GARMENTS: GarmentType[] = ['ROBE', 'JUPE', 'PANTALON', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'];

function engine(): PatternEngine {
  const e = new PatternEngine();
  [RobeRule, JupeRule, PantalonRule, VesteRule, ChemiseRule, CostumeRule, RobeMarieeRule, AutreRule].forEach((r) =>
    e.registerRule(r),
  );
  return e;
}

const base = (garmentType: GarmentType): PatternParameters => ({
  garmentType,
  cutType: 'DROITE',
  style: null,
  details: {},
});

describe('extended parameters contract (Phase 5b S1 — no geometry change yet)', () => {
  it.each(GARMENTS)('%s: CONFORT with default-valued extras is identical to no extras', (garment) => {
    const plain = engine().generate(base(garment), MEASUREMENTS).pieces;
    const withExt = engine().generate(
      { ...base(garment), ease: 'CONFORT', fullness: { skirt: 1, sleeve: 1 }, lengths: { skirtPct: 100 } },
      MEASUREMENTS,
    ).pieces;
    expect(withExt).toEqual(plain);
  });

  it.each(GARMENTS)('%s: extra measurements are accepted and never break generation', (garment) => {
    const result = engine().generate(base(garment), { ...MEASUREMENTS, TOUR_CUISSE: 58, LONGUEUR_BRAS: 60 });
    expect(result.pieces.length).toBeGreaterThan(0);
    for (const piece of result.pieces) {
      for (const point of piece.outlineMm) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
      }
    }
  });
});
