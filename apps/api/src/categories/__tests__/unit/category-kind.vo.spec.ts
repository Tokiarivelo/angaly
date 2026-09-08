import { CATEGORY_KINDS, isCategoryKind } from '../../domain/value-objects/category-kind.vo';

describe('isCategoryKind', () => {
  it('accepts every known kind', () => {
    for (const value of CATEGORY_KINDS) {
      expect(isCategoryKind(value)).toBe(true);
    }
  });

  it('rejects an unknown value', () => {
    expect(isCategoryKind('SERVICE')).toBe(false);
  });
});
