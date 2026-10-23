import { describe, expect, it } from 'vitest';
// Test-only import: the engine itself never depends on @angaly/types (rule 19); the catalog must follow the engine.
import { MEASUREMENT_CATALOG } from '../../../types/src/pattern-fit';
import { ChemiseRule } from '../rules/chemise.rule';
import { CostumeRule } from '../rules/costume.rule';
import { JupeRule } from '../rules/jupe.rule';
import { PantalonRule } from '../rules/pantalon.rule';
import { RobeMarieeRule } from '../rules/robe-mariee.rule';
import { RobeRule } from '../rules/robe.rule';
import { VesteRule } from '../rules/veste.rule';
import type { GarmentType, IPatternRule, MeasurementSet, PatternParameters } from '../types';

/** Details that make each rule use all it can (sleeves, collar, a skirt length, the trousers' own construction). */
// Trousers in the slim cut: the ankle girth only widens a narrow hem (it is a minimum).
const CUT: Partial<Record<GarmentType, string>> = { PANTALON: 'AJUSTEE', COSTUME: 'AJUSTEE' };
const CASES: Array<[GarmentType, IPatternRule, Record<string, string>]> = [
  ['ROBE', RobeRule, { manches: 'LONGUES', col: 'OFFICIER', longueur: 'MIDI' }],
  ['ROBE_MARIEE', RobeMarieeRule, { manches: 'LONGUES', longueur: 'SOL' }],
  ['JUPE', JupeRule, { longueur: 'GENOU' }],
  ['PANTALON', PantalonRule, { longueur: 'MAXI' }],
  ['VESTE', VesteRule, { manches: 'LONGUES' }],
  ['CHEMISE', ChemiseRule, { manches: 'LONGUES' }],
  ['COSTUME', CostumeRule, { manches: 'LONGUES', longueur: 'MAXI' }],
];
const BASE: MeasurementSet = { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42 };
// A second base with a high bust: the bust dart then exists, so its height and spacing can show.
const RICH: MeasurementSet = { ...BASE, TOUR_HAUT_POITRINE: 86 };

const shapeOf = (rule: IPatternRule, type: GarmentType, details: Record<string, string>, m: MeasurementSet): string =>
  JSON.stringify(rule.computePieces({ garmentType: type, cutType: CUT[type] ?? 'DROITE', style: null, details } as PatternParameters, m).map((p) => p.outlineMm));

/** A test value per measurement (cm): plausible, and away from each rule's own default so its effect shows. */
const TRY: Record<string, number> = {
  TOUR_HAUT_POITRINE: 84, TOUR_SOUS_POITRINE: 74, TOUR_HANCHE_COMPLET: 108, TOUR_COU: 40, TOUR_EMMANCHURE: 48,
  TOUR_CUISSE: 66, TOUR_GENOU: 44, TOUR_CHEVILLE: 34, TOUR_BRAS: 34, TOUR_POIGNET: 19, CARRURE_DOS: 33,
  CARRURE_DEVANT: 30, LARGEUR_EPAULE: 10, PENTE_EPAULE: 6.5, ECARTEMENT_POINTS_POITRINE: 16, LONGUEUR_DEVANT: 48,
  HAUTEUR_POITRINE: 30, HAUTEUR_BASSIN: 24, PROFONDEUR_EMMANCHURE: 23, LONGUEUR_BRAS: 64, LONGUEUR_JUPE: 75,
  HAUTEUR_TAILLE_GENOU: 54, HAUTEUR_FOURCHE: 30, LONGUEUR_ENFOURCHURE: 76, HAUTEUR_ENTREJAMBE: 74,
  LONGUEUR_JAMBE: 96, HAUTEUR_TAILLE_SOL: 110, STATURE: 178, LONGUEUR_TRAINE: 80,
};

/** Measurements whose value changes the pattern of this garment (each tried alone, off the default). */
function readBy(rule: IPatternRule, type: GarmentType, details: Record<string, string>): Set<string> {
  const read = new Set<string>();
  for (const def of MEASUREMENT_CATALOG) {
    if (def.key in BASE) continue;
    const value = TRY[def.key] ?? (def.minCm + def.maxCm) / 2;
    for (const base of [BASE, RICH]) {
      if (def.key in base) continue;
      if (shapeOf(rule, type, details, { ...base, [def.key]: value }) !== shapeOf(rule, type, details, base)) read.add(def.key);
    }
  }
  return read;
}

describe('the measurement catalog asks each garment for what its pattern reads', () => {
  it.each(CASES)('%s', (type, rule, details) => {
    const read = readBy(rule, type, details);
    const asked = new Set(
      MEASUREMENT_CATALOG.filter((d) => !(d.key in BASE) && (d.recommendedFor.includes(type) || d.requiredFor.includes(type))).map((d) => d.key),
    );
    expect({ readButNotAsked: [...read].filter((k) => !asked.has(k)).sort(), askedButIgnored: [...asked].filter((k) => !read.has(k)).sort() }).toEqual({
      readButNotAsked: [],
      askedButIgnored: [],
    });
  });
});
