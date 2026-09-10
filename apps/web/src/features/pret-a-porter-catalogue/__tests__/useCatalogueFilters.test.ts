import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCatalogueFilters } from '../hooks/useCatalogueFilters';

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/pret-a-porter',
  useSearchParams: () => currentSearchParams,
}));

describe('useCatalogueFilters', () => {
  beforeEach(() => {
    push.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it('defaults to sort=newest and page=1 with no query params', () => {
    const { result } = renderHook(() => useCatalogueFilters());

    expect(result.current.filters.sort).toBe('newest');
    expect(result.current.filters.page).toBe(1);
  });

  it('parses filters from the current URL search params', () => {
    currentSearchParams = new URLSearchParams('categoryId=cat-1&size=38&sort=priceAsc&page=2');
    const { result } = renderHook(() => useCatalogueFilters());

    expect(result.current.filters).toMatchObject({
      categoryId: 'cat-1',
      size: '38',
      sort: 'priceAsc',
      page: 2,
    });
  });

  it('setFilter pushes the new value and resets page to 1', () => {
    currentSearchParams = new URLSearchParams('page=3');
    const { result } = renderHook(() => useCatalogueFilters());

    result.current.setFilter('color', 'Navy');

    expect(push).toHaveBeenCalledWith('/pret-a-porter?color=Navy');
  });

  it('setFilter removes the key when given undefined', () => {
    currentSearchParams = new URLSearchParams('color=Navy');
    const { result } = renderHook(() => useCatalogueFilters());

    result.current.setFilter('color', undefined);

    expect(push).toHaveBeenCalledWith('/pret-a-porter?');
  });

  it('setPage updates only the page param', () => {
    currentSearchParams = new URLSearchParams('categoryId=cat-1');
    const { result } = renderHook(() => useCatalogueFilters());

    result.current.setPage(2);

    expect(push).toHaveBeenCalledWith('/pret-a-porter?categoryId=cat-1&page=2');
  });

  it('resetFilters navigates back to the bare pathname', () => {
    currentSearchParams = new URLSearchParams('categoryId=cat-1&size=38');
    const { result } = renderHook(() => useCatalogueFilters());

    result.current.resetFilters();

    expect(push).toHaveBeenCalledWith('/pret-a-porter');
  });
});
