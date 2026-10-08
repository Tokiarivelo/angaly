import { describe, it, expect } from 'vitest';
import { PATTERN_DETAIL_OPTIONS } from '@angaly/types';
import { DETAIL_GROUPS } from '../consts/details.const';

describe('detail options stay in sync with @angaly/types', () => {
  it('has exactly the shared groups and option ids', () => {
    const fromWeb = Object.fromEntries(
      DETAIL_GROUPS.map((group) => [group.id, group.options.map((option) => option.id)]),
    );
    expect(fromWeb).toEqual(PATTERN_DETAIL_OPTIONS);
  });
});
