import { describe, expect, it } from 'vitest';

import { catalogueFiltersSchema } from '../schemas/catalogue-filters.schema';

describe('catalogueFiltersSchema', () => {
  it('defaults sort to newest and page to 1 for an empty object', () => {
    const result = catalogueFiltersSchema.parse({});
    expect(result).toEqual({ sort: 'newest', page: 1 });
  });

  it('coerces a string page to a number', () => {
    const result = catalogueFiltersSchema.parse({ page: '3' });
    expect(result.page).toBe(3);
  });

  it('accepts a valid decimal priceMin/priceMax', () => {
    const result = catalogueFiltersSchema.safeParse({ priceMin: '50000.00', priceMax: '250000.00' });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed price string', () => {
    const result = catalogueFiltersSchema.safeParse({ priceMin: 'not-a-price' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown sort value', () => {
    const result = catalogueFiltersSchema.safeParse({ sort: 'popularity' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown status value', () => {
    const result = catalogueFiltersSchema.safeParse({ status: 'DISCONTINUED' });
    expect(result.success).toBe(false);
  });
});
