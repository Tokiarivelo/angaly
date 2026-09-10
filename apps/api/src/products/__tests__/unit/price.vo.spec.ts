import { createPrice, isValidPriceAmount } from '../../domain/value-objects/price.vo';

describe('isValidPriceAmount', () => {
  it('accepts an integer amount', () => {
    expect(isValidPriceAmount('150000')).toBe(true);
  });

  it('accepts up to 2 decimal places', () => {
    expect(isValidPriceAmount('150000.50')).toBe(true);
  });

  it('rejects more than 2 decimal places', () => {
    expect(isValidPriceAmount('150000.505')).toBe(false);
  });

  it('rejects a negative amount', () => {
    expect(isValidPriceAmount('-100')).toBe(false);
  });

  it('rejects a non-numeric string', () => {
    expect(isValidPriceAmount('abc')).toBe(false);
  });
});

describe('createPrice', () => {
  it('creates a valid price', () => {
    const price = createPrice('150000.00', 'MGA');
    expect(price).toEqual({ amount: '150000.00', currency: 'MGA' });
  });

  it('rejects an invalid amount', () => {
    expect(() => createPrice('not-a-number', 'MGA')).toThrow(
      'Price.amount must be a non-negative decimal string with at most 2 decimal places',
    );
  });

  it('rejects an empty currency', () => {
    expect(() => createPrice('150000.00', '')).toThrow('Price.currency must not be empty');
  });
});
