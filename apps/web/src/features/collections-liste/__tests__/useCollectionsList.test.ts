import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CollectionDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCollectionsList } from '../hooks/useCollectionsList';

const API_BASE_URL = 'http://localhost:3001/api';

function makeCollection(overrides: Partial<CollectionDto> = {}): CollectionDto {
  return {
    id: 'col-1',
    slug: 'collection-eternelle',
    name: 'Collection Éternelle',
    description: 'Une célébration de l’artisanat intemporel.',
    story: null,
    seasonYear: 2026,
    publishedAt: '2026-02-01T00:00:00.000Z',
    media: [],
    creationsCount: 12,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function mockCollections(collections: CollectionDto[]) {
  server.use(
    http.get(`${API_BASE_URL}/collections`, ({ request }) => {
      const url = new URL(request.url);
      const sort = url.searchParams.get('sort');
      const data = sort === 'publishedAt:desc' ? collections.slice(0, 1) : collections;
      return HttpResponse.json({
        success: true,
        data: {
          data,
          meta: { total: data.length, page: 1, limit: 40, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        },
      });
    }),
  );
}

describe('useCollectionsList', () => {
  it('excludes the featured collection from the grid', async () => {
    mockCollections([
      makeCollection({ id: 'col-1', slug: 'collection-eternelle' }),
      makeCollection({ id: 'col-2', slug: 'lart-de-la-dentelle', name: 'L’Art de la Dentelle' }),
    ]);

    const { result } = renderHook(() => useCollectionsList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.featured?.id).toBe('col-1');
    expect(result.current.grid.map((c) => c.id)).toEqual(['col-2']);
  });

  it('has no featured collection and an empty grid when none are published', async () => {
    mockCollections([]);

    const { result } = renderHook(() => useCollectionsList(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.featured).toBeNull();
    expect(result.current.grid).toEqual([]);
  });
});
