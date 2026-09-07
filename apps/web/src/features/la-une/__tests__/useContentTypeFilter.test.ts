import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useContentTypeFilter } from '../hooks/useContentTypeFilter';
import type { LaUneItem } from '../types/la-une-item.types';

const ITEMS: LaUneItem[] = [
  {
    id: '1',
    slug: 'a',
    title: 'A',
    description: '',
    imageUrl: null,
    contentType: 'mariage',
    date: null,
    href: '/creations/a',
  },
  {
    id: '2',
    slug: 'b',
    title: 'B',
    description: '',
    imageUrl: null,
    contentType: 'costume',
    date: null,
    href: '/creations/b',
  },
  {
    id: '3',
    slug: 'c',
    title: 'C',
    description: '',
    imageUrl: null,
    contentType: null,
    date: null,
    href: '/creations/c',
  },
];

describe('useContentTypeFilter', () => {
  it('starts on "all" and returns every item', () => {
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    expect(result.current.activeFilter).toBe('all');
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it('filters client-side to only items matching the active content type', () => {
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    act(() => result.current.setActiveFilter('mariage'));

    expect(result.current.activeFilter).toBe('mariage');
    expect(result.current.filteredItems).toEqual([ITEMS[0]]);
  });

  it('returns an empty list for a pill with no backing data (e.g. "coulisses")', () => {
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    act(() => result.current.setActiveFilter('coulisses'));

    expect(result.current.filteredItems).toEqual([]);
  });
});
