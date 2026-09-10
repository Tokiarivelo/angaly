import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useProducts } from '../hooks/useProducts';
import { catalogueFiltersSchema } from '../schemas/catalogue-filters.schema';

describe('useProducts', () => {
  it('starts in a loading state with no items', () => {
    const { result } = renderHook(() => useProducts(catalogueFiltersSchema.parse({})), {
      wrapper: withQueryClient(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('resolves with the products returned by the API (mocked via MSW)', async () => {
    const { result } = renderHook(() => useProducts(catalogueFiltersSchema.parse({})), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.slug).toBe('robe-saphir');
    expect(result.current.total).toBe(1);
    expect(result.current.isError).toBe(false);
  });
});
