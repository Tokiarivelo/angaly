import { isProductAvailability, PRODUCT_AVAILABILITIES } from '../../domain/value-objects/product-availability.vo';

describe('isProductAvailability', () => {
  it('accepts every known availability', () => {
    for (const value of PRODUCT_AVAILABILITIES) {
      expect(isProductAvailability(value)).toBe(true);
    }
  });

  it('rejects an unknown value', () => {
    expect(isProductAvailability('DISCONTINUED')).toBe(false);
  });
});
