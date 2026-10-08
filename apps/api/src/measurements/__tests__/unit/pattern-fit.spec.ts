import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import {
  EASE_LEVELS,
  FIT_GARMENT_TYPES,
  MEASUREMENT_CATALOG,
  MeasurementUnit,
  checkMeasurementCoherence,
  listPatternExtKeys,
  mergePatternExtParameters,
  measurementFieldsFor,
  recommendedMeasurementKeysFor,
  requiredMeasurementKeysFor,
  validateMeasurementValues,
  validatePatternExtParameters,
} from '@angaly/types';
import {
  AutreRule,
  ChemiseRule,
  CostumeRule,
  JupeRule,
  PantalonRule,
  RobeMarieeRule,
  RobeRule,
  VesteRule,
  type IPatternRule,
} from '@angaly/pattern-engine';
import { assertValidMeasurements } from '../../application/services/assert-valid-measurements';

const RULES: IPatternRule[] = [
  RobeRule,
  JupeRule,
  PantalonRule,
  VesteRule,
  CostumeRule,
  ChemiseRule,
  RobeMarieeRule,
  AutreRule,
];

describe('measurement catalogue', () => {
  it('has unique keys with sane bounds', () => {
    const keys = MEASUREMENT_CATALOG.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const m of MEASUREMENT_CATALOG) {
      expect(m.minCm).toBeLessThan(m.maxCm);
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.help.length).toBeGreaterThan(0);
    }
  });

  it.each(RULES.map((rule) => [rule.garmentType, rule] as const))(
    'required keys for %s match the engine rule (no drift)',
    (garment, rule) => {
      expect([...requiredMeasurementKeysFor(garment)].sort()).toEqual(
        [...rule.requiredMeasurementKeys].sort(),
      );
    },
  );

  it('covers every garment type the engine knows', () => {
    expect([...FIT_GARMENT_TYPES].sort()).toEqual(RULES.map((r) => r.garmentType).sort());
  });

  it('every measurement key read by a rule is in the catalogue', () => {
    const rulesDir = join(__dirname, '../../../../../../packages/pattern-engine/src/rules');
    const known = new Set(MEASUREMENT_CATALOG.map((m) => m.key));
    const used = new Set<string>();
    for (const file of readdirSync(rulesDir).filter((f) => f.endsWith('.rule.ts'))) {
      const source = readFileSync(join(rulesDir, file), 'utf8');
      for (const match of source.matchAll(/measurements\[['"]([A-Z_]+)['"]\]/g)) used.add(match[1]);
    }
    expect(used.size).toBeGreaterThan(0);
    // LONGUEUR_PANTALON is the legacy alias of LONGUEUR_JAMBE, still read as a fallback.
    const legacyAliases = new Set(['LONGUEUR_PANTALON']);
    for (const key of used) expect(known.has(key) || legacyAliases.has(key)).toBe(true);
  });

  it('every catalogue measurement is read by at least one engine rule (nothing asked for nothing)', () => {
    const dirs = ['rules', 'shared'].map((d) => join(__dirname, '../../../../../../packages/pattern-engine/src', d));
    const source = dirs
      .flatMap((dir) => readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8')))
      .join('\n');
    const unused = MEASUREMENT_CATALOG.map((m) => m.key).filter((key) => !source.includes(`'${key}'`));
    expect(unused).toEqual([]);
  });

  it('lists required then recommended fields for a garment, without duplicates', () => {
    const fields = measurementFieldsFor('PANTALON');
    const keys = fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(fields.filter((f) => f.necessity === 'REQUIRED').map((f) => f.key)).toEqual(
      requiredMeasurementKeysFor('PANTALON'),
    );
    expect(keys).toEqual(expect.arrayContaining(recommendedMeasurementKeysFor('PANTALON')));
    expect(keys.indexOf('TOUR_TAILLE')).toBeLessThan(keys.indexOf('TOUR_CUISSE'));
  });

  it('falls back to the common essentials without a garment', () => {
    const keys = measurementFieldsFor(null).map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(['TOUR_POITRINE', 'TOUR_TAILLE', 'TOUR_BASSIN']));
  });
});

describe('validateMeasurementValues', () => {
  it('accepts plausible values and rejects typos', () => {
    const { valid, issues } = validateMeasurementValues({
      TOUR_TAILLE: 70,
      TOUR_BASSIN: 950,
      TOUR_POITRINE: 'x',
      LONGUEUR_DOS: -3,
      TOUR_COU: 5,
    });
    expect(valid).toEqual({ TOUR_TAILLE: 70 });
    expect(Object.fromEntries(issues.map((i) => [i.key, i.reason]))).toEqual({
      TOUR_BASSIN: 'ABOVE_MAX',
      TOUR_POITRINE: 'NOT_A_NUMBER',
      LONGUEUR_DOS: 'NOT_POSITIVE',
      TOUR_COU: 'BELOW_MIN',
    });
  });

  it('tolerates unknown legacy keys but not absurd ones', () => {
    expect(validateMeasurementValues({ CUSTOM_KEY: 50 }).issues).toHaveLength(0);
    expect(validateMeasurementValues({ CUSTOM_KEY: 5000 }).issues).toHaveLength(1);
  });

  it('allows a zero train length only', () => {
    expect(validateMeasurementValues({ LONGUEUR_TRAINE: 0 }).issues).toHaveLength(0);
    expect(validateMeasurementValues({ TOUR_TAILLE: 0 }).issues).toHaveLength(1);
  });
});

describe('checkMeasurementCoherence', () => {
  it('is silent for a coherent body', () => {
    expect(
      checkMeasurementCoherence({ TOUR_POITRINE: 92, TOUR_SOUS_POITRINE: 78, TOUR_TAILLE: 74, TOUR_BASSIN: 98 }),
    ).toEqual([]);
  });

  it('flags impossible combinations', () => {
    const warnings = checkMeasurementCoherence({
      TOUR_POITRINE: 80,
      TOUR_SOUS_POITRINE: 90,
      TOUR_TAILLE: 101,
      TOUR_BASSIN: 85,
      TOUR_CUISSE: 50,
      TOUR_GENOU: 55,
    });
    expect(warnings.length).toBeGreaterThanOrEqual(4);
  });
});

describe('validatePatternExtParameters', () => {
  it('returns an empty value for null / undefined (engine defaults)', () => {
    expect(validatePatternExtParameters(undefined)).toEqual({ value: {}, issues: [] });
    expect(validatePatternExtParameters(null)).toEqual({ value: {}, issues: [] });
  });

  it.each(EASE_LEVELS)('accepts ease %s', (ease) => {
    expect(validatePatternExtParameters({ ease }).value).toEqual({ ease });
  });

  it('snaps to the step and keeps bound edges', () => {
    const { value, issues } = validatePatternExtParameters({
      fullness: { skirt: 4, sleeve: 1.1 },
      lengths: { skirtPct: 40, sleevePct: 0, bodicePct: 120 },
    });
    expect(issues).toEqual([]);
    expect(value.fullness).toEqual({ skirt: 4, sleeve: 1 });
    expect(value.lengths).toEqual({ skirtPct: 40, sleevePct: 0, bodicePct: 120 });
  });

  it('rejects (never clamps) out-of-range and mistyped values', () => {
    const { value, issues } = validatePatternExtParameters({
      ease: 'XXL',
      fullness: { skirt: 4.01, sleeve: '2' },
      lengths: { skirtPct: 39, bodicePct: Number.NaN },
    });
    expect(value).toEqual({});
    expect(issues.map((i) => i.path).sort()).toEqual(
      ['ease', 'fullness.skirt', 'fullness.sleeve', 'lengths.bodicePct', 'lengths.skirtPct'].sort(),
    );
  });

  it('rejects non-objects', () => {
    expect(validatePatternExtParameters('AMPLE').issues).toHaveLength(1);
    expect(validatePatternExtParameters([]).issues).toHaveLength(1);
    expect(validatePatternExtParameters({ fullness: 3 }).issues).toHaveLength(1);
  });
});

describe('assertValidMeasurements', () => {
  it('passes plausible cm values and ignores zeros', () => {
    expect(() => assertValidMeasurements({ TOUR_TAILLE: 70, TOUR_BASSIN: 0 }, MeasurementUnit.CM)).not.toThrow();
  });

  it('throws a 400 listing every problem', () => {
    try {
      assertValidMeasurements({ TOUR_TAILLE: 900, TOUR_COU: 3 }, MeasurementUnit.CM);
      fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as { errors: string[] };
      expect(body.errors).toHaveLength(2);
    }
  });

  it('converts inches before checking bounds', () => {
    // 28 in = 71 cm: plausible waist; 28 cm would not be.
    expect(() => assertValidMeasurements({ TOUR_TAILLE: 28 }, MeasurementUnit.INCH)).not.toThrow();
    expect(() => assertValidMeasurements({ TOUR_TAILLE: 28 }, MeasurementUnit.CM)).toThrow(BadRequestException);
  });
});

describe('validatePatternExtParameters — drape blocks (S4)', () => {
  const drape = (...blocks: unknown[]) => validatePatternExtParameters({ drape: { blocks } });

  it('accepts every block kind and snaps numbers to their step', () => {
    const { value, issues } = drape(
      { kind: 'PLEATED_SKIRT', pleats: 24.4, depthMm: 25, type: 'BOX' },
      { kind: 'WRAP_FRONT', overlapMm: 100, side: 'LEFT' },
      { kind: 'COWL_NECK', depthMm: 150 },
    );
    expect(issues).toEqual([]);
    expect(value.drape?.blocks).toEqual([
      { kind: 'PLEATED_SKIRT', pleats: 24, depthMm: 25, type: 'BOX' },
      { kind: 'WRAP_FRONT', overlapMm: 100, side: 'LEFT' },
      { kind: 'COWL_NECK', depthMm: 150 },
    ]);
    expect(drape({ kind: 'GATHERED_SKIRT', fullness: 2.1 }).value.drape?.blocks).toEqual([
      { kind: 'GATHERED_SKIRT', fullness: 2 },
    ]);
    for (const fraction of [0.25, 0.5, 1]) {
      expect(drape({ kind: 'CIRCLE_SKIRT', fraction }).value.drape?.blocks[0]).toEqual({ kind: 'CIRCLE_SKIRT', fraction });
    }
  });

  it('rejects out-of-range numbers, unknown kinds and bad enums — dropping only the bad block', () => {
    const { value, issues } = drape(
      { kind: 'GATHERED_SKIRT', fullness: 9 },
      { kind: 'COWL_NECK', depthMm: 150 },
      { kind: 'CIRCLE_SKIRT', fraction: 0.3 },
    );
    expect(value.drape?.blocks).toEqual([{ kind: 'COWL_NECK', depthMm: 150 }]);
    expect(issues.map((i) => i.path)).toEqual(['drape.blocks[0].fullness', 'drape.blocks[2].fraction']);
    expect(drape({ kind: 'HOVERCRAFT' }).issues[0]?.path).toBe('drape.blocks[0].kind');
  });

  it('requires the mandatory fields of each block', () => {
    expect(drape({ kind: 'GATHERED_SKIRT' }).issues).toHaveLength(1);
    expect(drape({ kind: 'PLEATED_SKIRT', pleats: 10, type: 'KNIFE' }).issues.length).toBeGreaterThan(0);
    expect(drape({ kind: 'WRAP_FRONT', overlapMm: 100 }).issues).toHaveLength(1);
    expect(drape({ kind: 'COWL_NECK' }).value.drape).toBeUndefined();
  });

  it('allows one block per kind and a single skirt block', () => {
    const twoSkirts = drape({ kind: 'GATHERED_SKIRT', fullness: 2 }, { kind: 'CIRCLE_SKIRT', fraction: 1 });
    expect(twoSkirts.value.drape?.blocks).toEqual([{ kind: 'GATHERED_SKIRT', fullness: 2 }]);
    expect(twoSkirts.issues[0]?.message).toMatch(/Un seul bloc de jupe/);
    const twice = drape({ kind: 'COWL_NECK', depthMm: 100 }, { kind: 'COWL_NECK', depthMm: 200 });
    expect(twice.value.drape?.blocks).toHaveLength(1);
    expect(twice.issues).toHaveLength(1);
  });

  it('caps the number of blocks and rejects malformed specs', () => {
    expect(drape(...Array.from({ length: 4 }, () => ({ kind: 'COWL_NECK', depthMm: 100 }))).issues.length).toBeGreaterThan(0);
    expect(validatePatternExtParameters({ drape: 'x' }).issues).toHaveLength(1);
    expect(validatePatternExtParameters({ drape: { blocks: 'x' } }).issues).toHaveLength(1);
    expect(validatePatternExtParameters({ drape: { blocks: [] } })).toEqual({ value: { drape: { blocks: [] } }, issues: [] });
    expect(validatePatternExtParameters({ drape: { blocks: [42] } }).issues).toHaveLength(1);
  });

  it('merges drape as one indivisible choice: the first source with a valid one wins', () => {
    const { value, origin } = mergePatternExtParameters(
      { ease: 'AMPLE' },
      { drape: { blocks: [{ kind: 'COWL_NECK', depthMm: 100 }] } },
      { drape: { blocks: [{ kind: 'GATHERED_SKIRT', fullness: 2 }] } },
    );
    expect(value.drape?.blocks).toEqual([{ kind: 'COWL_NECK', depthMm: 100 }]);
    expect(origin['drape']).toBe(1);
    expect(listPatternExtKeys(value)).toEqual(['ease', 'drape']);
  });

  it('an explicit empty drape beats a photo suggestion; an all-invalid one does not', () => {
    const suggestion = { drape: { blocks: [{ kind: 'TRAIN', lengthMm: 900 }] } } as never;
    const none = mergePatternExtParameters({ drape: { blocks: [] } }, suggestion);
    expect(none.value.drape).toEqual({ blocks: [] });
    expect(none.origin['drape']).toBe(0);
    expect(listPatternExtKeys(none.value)).toEqual([]);

    const invalid = mergePatternExtParameters({ drape: { blocks: [{ kind: 'TRAIN', lengthMm: 99999 }] } } as never, suggestion);
    expect(invalid.value.drape?.blocks).toEqual([{ kind: 'TRAIN', lengthMm: 900 }]);
  });
});
