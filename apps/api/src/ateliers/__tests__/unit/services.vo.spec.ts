import { parseServices } from '../../domain/value-objects/services.vo';

describe('parseServices', () => {
  it('returns the string entries of an array', () => {
    expect(parseServices(['Essayage', 'Retouche'])).toEqual(['Essayage', 'Retouche']);
  });

  it('filters out non-string entries', () => {
    expect(parseServices(['Essayage', 42, null, 'Retouche'])).toEqual(['Essayage', 'Retouche']);
  });

  it('returns an empty array for null, undefined, or a non-array value', () => {
    expect(parseServices(null)).toEqual([]);
    expect(parseServices(undefined)).toEqual([]);
    expect(parseServices('not-an-array')).toEqual([]);
  });
});
