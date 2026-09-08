import { describe, expect, it } from 'vitest';

import { estimateReadingTime } from '../utils/reading-time.util';

describe('estimateReadingTime', () => {
  it('estimates roughly 1 minute per 200 words', () => {
    const content = Array.from({ length: 400 }, () => 'mot').join(' ');
    expect(estimateReadingTime(content)).toBe(2);
  });

  it('never returns less than 1 minute for short content', () => {
    expect(estimateReadingTime('Un texte très court.')).toBe(1);
  });

  it('ignores extra whitespace when counting words', () => {
    expect(estimateReadingTime('  mot   mot  \n\n mot  ')).toBe(1);
  });
});
