import { MIN_SEARCH_QUERY_LENGTH, normalizeSearchQuery } from '../../domain/value-objects/search-query.vo';

describe('normalizeSearchQuery', () => {
  it('trims a valid query', () => {
    expect(normalizeSearchQuery('  robe  ')).toBe('robe');
  });

  it(`accepts a query of exactly ${MIN_SEARCH_QUERY_LENGTH} characters`, () => {
    expect(normalizeSearchQuery('ro')).toBe('ro');
  });

  it('throws for a query shorter than the minimum length', () => {
    expect(() => normalizeSearchQuery('r')).toThrow(
      `Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`,
    );
  });

  it('throws for an empty, whitespace-only, undefined, or null query', () => {
    expect(() => normalizeSearchQuery('')).toThrow();
    expect(() => normalizeSearchQuery('   ')).toThrow();
    expect(() => normalizeSearchQuery(undefined)).toThrow();
    expect(() => normalizeSearchQuery(null)).toThrow();
  });
});
