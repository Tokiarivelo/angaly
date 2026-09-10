import { generateQuoteNumber, isValidQuoteNumber } from '../../domain/value-objects/quote-number.vo';

describe('generateQuoteNumber', () => {
  it('includes the UTC year of the given date', () => {
    const number = generateQuoteNumber(new Date('2026-09-15T00:00:00.000Z'));
    expect(number).toMatch(/^ANG-DEV-2026-/);
  });

  it('generates a value that passes isValidQuoteNumber', () => {
    expect(isValidQuoteNumber(generateQuoteNumber())).toBe(true);
  });

  it('generates different numbers on each call', () => {
    expect(generateQuoteNumber()).not.toBe(generateQuoteNumber());
  });
});

describe('isValidQuoteNumber', () => {
  it('rejects a predictable sequential-looking number', () => {
    expect(isValidQuoteNumber('ANG-DEV-2026-00001')).toBe(false);
  });

  it('rejects a malformed string', () => {
    expect(isValidQuoteNumber('not-a-quote-number')).toBe(false);
  });
});
