import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { SearchResultsResponseDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useGlobalSearch } from '../hooks/useGlobalSearch';

const API_BASE_URL = 'http://localhost:3003/api';

function makeResults(overrides: Partial<SearchResultsResponseDto> = {}): SearchResultsResponseDto {
  return {
    creations: [],
    products: [],
    collections: [],
    blogPosts: [],
    ateliers: [],
    ...overrides,
  };
}

describe('useGlobalSearch', () => {
  it('does not fetch below the minimum query length', () => {
    const { result } = renderHook(() => useGlobalSearch('r'), { wrapper: withQueryClient() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasResults).toBe(false);
  });

  it('resolves grouped results and reports hasResults when any group is non-empty', async () => {
    server.use(
      http.get(`${API_BASE_URL}/search`, () =>
        HttpResponse.json({
          success: true,
          data: makeResults({
            creations: [{ id: 'c1', slug: 'robe-eternelle', title: 'Robe Éternelle', excerpt: '', imageUrl: null }],
          }),
        }),
      ),
    );

    const { result } = renderHook(() => useGlobalSearch('robe'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasResults).toBe(true);
    expect(result.current.results.creations).toHaveLength(1);
  });

  it('reports hasResults as false when every group is empty', async () => {
    server.use(
      http.get(`${API_BASE_URL}/search`, () => HttpResponse.json({ success: true, data: makeResults() })),
    );

    const { result } = renderHook(() => useGlobalSearch('zzz'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasResults).toBe(false);
  });
});
