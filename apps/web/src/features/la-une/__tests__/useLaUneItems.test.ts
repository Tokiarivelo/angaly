import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useLaUneItems } from '../hooks/useLaUneItems';

const API_BASE_URL = 'http://localhost:3001/api';

describe('useLaUneItems', () => {
  it('splits the featured creation into a hero and an empty grid when it is the only item', async () => {
    const { result } = renderHook(() => useLaUneItems(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hero?.slug).toBe('robe-eternelle');
    expect(result.current.grid).toEqual([]);
  });

  it('puts the featured collection as the hero and every creation in the grid', async () => {
    server.use(
      http.get(`${API_BASE_URL}/collections`, () =>
        HttpResponse.json({
          success: true,
          data: {
            data: [
              {
                id: 'collection-1',
                slug: 'collection-eclat',
                name: 'Collection Éclat',
                description: 'La nouvelle collection.',
                story: null,
                seasonYear: 2026,
                publishedAt: '2026-01-01T00:00:00.000Z',
                media: [],
                creationsCount: 1,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            meta: { total: 1, page: 1, limit: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        }),
      ),
    );

    const { result } = renderHook(() => useLaUneItems(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hero?.slug).toBe('collection-eclat');
    expect(result.current.grid).toHaveLength(1);
    expect(result.current.grid[0]?.slug).toBe('robe-eternelle');
  });
});
