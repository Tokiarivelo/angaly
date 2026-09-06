import { describe, expect, it } from 'vitest';

import { cn, formatPriceAriary, truncate } from '../utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-angaly-navy', undefined, 'font-bold')).toBe('text-angaly-navy font-bold');
  });
});

describe('formatPriceAriary', () => {
  it('formats a number with French thousands separators and the Ar suffix', () => {
    expect(formatPriceAriary(890000)).toBe('890 000 Ar');
    expect(formatPriceAriary(0)).toBe('0 Ar');
  });
});

describe('truncate', () => {
  it('returns the string unchanged when shorter than maxLength', () => {
    expect(truncate('Robe Éternelle', 50)).toBe('Robe Éternelle');
  });

  it('truncates and appends an ellipsis when longer than maxLength', () => {
    expect(truncate('Robe de mariée sur mesure, Collection Éternelle', 20)).toBe(
      'Robe de mariée su...',
    );
  });
});
