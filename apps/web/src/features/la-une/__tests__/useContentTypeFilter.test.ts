import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContentTypeFilter } from '../hooks/useContentTypeFilter';
import type { LaUneItem } from '../types/la-une-item.types';

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/la-une',
  useSearchParams: () => currentSearchParams,
}));

const ITEMS: LaUneItem[] = [
  {
    id: '1',
    slug: 'a',
    title: 'A',
    description: '',
    imageUrl: null,
    contentType: 'sur-mesure',
    date: null,
    href: '/creations/a',
  },
  {
    id: '2',
    slug: 'b',
    title: 'B',
    description: '',
    imageUrl: null,
    contentType: 'coulisses',
    date: null,
    href: '/creations/b',
  },
  {
    id: '3',
    slug: 'c',
    title: 'C',
    description: '',
    imageUrl: null,
    contentType: 'creation-du-mois',
    date: null,
    href: '/creations/c',
  },
];

describe('useContentTypeFilter', () => {
  beforeEach(() => {
    push.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it('starts on "all" and returns every item when no query param exists', () => {
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    expect(result.current.activeFilter).toBe('all');
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it('initializes active filter from URL query param', () => {
    currentSearchParams = new URLSearchParams('type=sur-mesure');
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    expect(result.current.activeFilter).toBe('sur-mesure');
    expect(result.current.filteredItems).toEqual([ITEMS[0]]);
  });

  it('falls back to "all" when URL query param has an unknown value', () => {
    currentSearchParams = new URLSearchParams('type=invalide');
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    expect(result.current.activeFilter).toBe('all');
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it('pushes the new URL query param on setActiveFilter', () => {
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    act(() => result.current.setActiveFilter('coulisses'));

    expect(push).toHaveBeenCalledWith('/la-une?type=coulisses', { scroll: false });
  });

  it('removes the type param from URL when setActiveFilter("all") is called', () => {
    currentSearchParams = new URLSearchParams('type=coulisses');
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    act(() => result.current.setActiveFilter('all'));

    expect(push).toHaveBeenCalledWith('/la-une', { scroll: false });
  });

  it('returns an empty list when no items match the active filter', () => {
    currentSearchParams = new URLSearchParams('type=collection-du-moment');
    const { result } = renderHook(() => useContentTypeFilter(ITEMS));

    expect(result.current.activeFilter).toBe('collection-du-moment');
    expect(result.current.filteredItems).toEqual([]);
  });
});
