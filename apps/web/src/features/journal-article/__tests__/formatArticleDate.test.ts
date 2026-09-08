import { describe, expect, it } from 'vitest';

import { formatArticleDate } from '../utils/formatArticleDate';

describe('formatArticleDate', () => {
  it('formats an ISO date as a long French date', () => {
    expect(formatArticleDate('2026-03-01T00:00:00.000Z')).toBe('1 mars 2026');
  });
});
