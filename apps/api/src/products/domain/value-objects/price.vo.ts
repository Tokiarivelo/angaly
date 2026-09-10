/**
 * amount is a decimal string, never a float — Prisma's `Decimal(12,2)` columns
 * are read as Decimal.js objects and converted to `.toString()` at the
 * repository boundary; a JS float would risk precision loss on money.
 */
export interface Price {
  amount: string;
  currency: string;
}

const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidPriceAmount(amount: string): boolean {
  return DECIMAL_STRING_PATTERN.test(amount);
}

export function createPrice(amount: string, currency: string): Price {
  if (!isValidPriceAmount(amount)) {
    throw new Error('Price.amount must be a non-negative decimal string with at most 2 decimal places');
  }
  if (!currency.trim()) {
    throw new Error('Price.currency must not be empty');
  }
  return { amount, currency };
}
