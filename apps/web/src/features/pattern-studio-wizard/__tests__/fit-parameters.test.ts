import { describe, expect, it } from 'vitest';
import { applyFitChange, fitControlsFor } from '../utils/fit-parameters';

describe('applyFitChange', () => {
  it('sets, replaces and clears the ease', () => {
    const a = applyFitChange(undefined, { field: 'ease', value: 'AMPLE' });
    expect(a).toEqual({ ease: 'AMPLE' });
    expect(applyFitChange(a, { field: 'ease', value: 'AJUSTE' })).toEqual({ ease: 'AJUSTE' });
    expect(applyFitChange(a, { field: 'ease', value: null })).toEqual({});
  });

  it('builds nested fullness / lengths and drops empty groups', () => {
    let fit = applyFitChange(undefined, { field: 'fullness.skirt', value: 2 });
    fit = applyFitChange(fit, { field: 'lengths.skirtPct', value: 90 });
    expect(fit).toEqual({ fullness: { skirt: 2 }, lengths: { skirtPct: 90 } });

    fit = applyFitChange(fit, { field: 'fullness.skirt', value: null });
    expect(fit).toEqual({ lengths: { skirtPct: 90 } });
  });

  it('snaps to the step', () => {
    expect(applyFitChange(undefined, { field: 'fullness.sleeve', value: 1.6 })).toEqual({
      fullness: { sleeve: 1.5 },
    });
  });

  it('keeps the previous value when the new one is out of range', () => {
    const current = { fullness: { skirt: 2 } };
    expect(applyFitChange(current, { field: 'fullness.skirt', value: 9 })).toEqual(current);
    expect(applyFitChange(undefined, { field: 'lengths.skirtPct', value: 5 })).toEqual({});
  });

  it('does not mutate its input', () => {
    const current = Object.freeze({ lengths: Object.freeze({ bodicePct: 100 }) });
    expect(() => applyFitChange(current, { field: 'lengths.bodicePct', value: 110 })).not.toThrow();
    expect(current.lengths.bodicePct).toBe(100);
  });
});

describe('fitControlsFor', () => {
  it.each([
    ['JUPE', { skirt: true, sleeve: false, bodice: false }],
    ['PANTALON', { skirt: false, sleeve: false, bodice: false }],
    ['CHEMISE', { skirt: false, sleeve: true, bodice: true }],
    ['robe_mariee', { skirt: true, sleeve: true, bodice: true }],
    [undefined, { skirt: false, sleeve: false, bodice: false }],
  ])('%s', (garment, expected) => {
    expect(fitControlsFor(garment)).toEqual(expected);
  });
});

import { buildFitRows, effectiveFit, suggestedFitFrom } from '../utils/fit-parameters';
import type { GarmentProfile } from '@angaly/types';

const profile = (fit: unknown, isGarment = true): GarmentProfile =>
  ({ isGarment, garmentType: 'ROBE', occasion: null, style: null, cutType: null, details: {}, fit }) as GarmentProfile;

describe('suggestedFitFrom', () => {
  it('returns the validated photo suggestion', () => {
    expect(suggestedFitFrom(profile({ ease: 'AMPLE', fullness: { skirt: 2 }, fabricBehavior: 'FLUIDE' }))).toEqual({
      ease: 'AMPLE',
      fullness: { skirt: 2 },
    });
  });

  it('drops invalid values, and ignores non-garments, missing fit and empty results', () => {
    expect(suggestedFitFrom(profile({ ease: 'GIGANTESQUE', lengths: { skirtPct: 90 } }))).toEqual({
      lengths: { skirtPct: 90 },
    });
    expect(suggestedFitFrom(profile({ ease: 'AMPLE' }, false))).toBeUndefined();
    expect(suggestedFitFrom(profile(undefined))).toBeUndefined();
    expect(suggestedFitFrom(profile({ fabricBehavior: 'FLUIDE' }))).toBeUndefined();
    expect(suggestedFitFrom(null)).toBeUndefined();
  });
});

describe('effectiveFit', () => {
  it('uses the suggestion until the customer chooses, key by key', () => {
    const { value, fromSuggestion } = effectiveFit(
      { ease: 'CONFORT' },
      { ease: 'AMPLE', fullness: { skirt: 2 } },
    );
    expect(value).toEqual({ ease: 'CONFORT', fullness: { skirt: 2 } });
    expect(fromSuggestion).toEqual(['fullness.skirt']);
  });

  it('is empty without any source', () => {
    expect(effectiveFit(undefined, undefined)).toEqual({ value: {}, fromSuggestion: [] });
  });
});

describe('buildFitRows', () => {
  it('lists the suggestions in French, nothing when there is none', () => {
    const rows = buildFitRows(
      profile({
        ease: 'AMPLE',
        fullness: { skirt: 2.5 },
        lengths: { skirtPct: 90, sleevePct: 0 },
        fabricBehavior: 'RIGIDE',
      }),
    );
    expect(rows).toEqual([
      { label: 'Aisance', value: 'Ample' },
      { label: 'Ampleur de jupe', value: '×2.5' },
      { label: 'Longueur de jupe', value: '90 %' },
      { label: 'Longueur de manche', value: '0 %' },
      { label: 'Tissu', value: 'Rigide' },
    ]);
    expect(buildFitRows(profile(undefined))).toEqual([]);
    expect(buildFitRows(undefined)).toEqual([]);
  });
});
