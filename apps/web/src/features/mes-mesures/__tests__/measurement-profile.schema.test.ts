import { describe, expect, it } from 'vitest';
import { MeasurementUnit } from '@angaly/types';
import { measurementProfileSchema } from '../schemas/measurement-profile.schema';
import { MEASUREMENT_FIELD_GROUPS, MEASUREMENT_FIELDS } from '../consts/measurement-fields.const';

const parse = (values: Record<string, number>, unit = MeasurementUnit.CM) =>
  measurementProfileSchema.safeParse({ label: 'Test', unit, values });

describe('measurementProfileSchema', () => {
  it('treats empty inputs (NaN) as not provided', () => {
    const result = parse({ TOUR_TAILLE: 70, TOUR_BASSIN: Number.NaN });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.values['TOUR_BASSIN']).toBeUndefined();
  });

  it('rejects implausible values with a message on the right key', () => {
    const result = parse({ TOUR_TAILLE: 700 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['values', 'TOUR_TAILLE']);
      expect(result.error.issues[0]?.message).toMatch(/maximum plausible/);
    }
  });

  it('converts inches before checking the bounds', () => {
    expect(parse({ TOUR_TAILLE: 28 }, MeasurementUnit.INCH).success).toBe(true);
    expect(parse({ TOUR_TAILLE: 28 }, MeasurementUnit.CM).success).toBe(false);
  });
});

describe('measurement fields', () => {
  it('exposes every catalogue measurement exactly once across the groups', () => {
    const grouped = MEASUREMENT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect(grouped.sort()).toEqual(MEASUREMENT_FIELDS.map((f) => f.key).sort());
    expect(MEASUREMENT_FIELDS.length).toBeGreaterThan(6);
  });
});
