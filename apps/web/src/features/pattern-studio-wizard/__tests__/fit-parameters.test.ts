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
