import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCollectionDetail } from '../hooks/useCollectionDetail';

const API_BASE_URL = 'http://localhost:3003/api';

describe('useCollectionDetail', () => {
  it('starts loading with no data', () => {
    const { result } = renderHook(() => useCollectionDetail('collection-eternelle'), {
      wrapper: withQueryClient(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('resolves with the collection matching the slug, including its creations', async () => {
    server.use(
      http.get(`${API_BASE_URL}/collections/collection-eternelle`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: 'col-1',
            slug: 'collection-eternelle',
            name: 'Collection Éternelle',
            description: "Où l'artisanat rencontre l'immortalité.",
            story: null,
            seasonYear: 2026,
            publishedAt: '2026-01-01T00:00:00.000Z',
            media: [],
            creationsCount: 1,
            creations: [{ id: 'c1', slug: 'eternite', name: "L'Éternité", coverImageUrl: null }],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    );

    const { result } = renderHook(() => useCollectionDetail('collection-eternelle'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data?.name).toBe('Collection Éternelle');
    expect(result.current.data?.creations).toHaveLength(1);
  });

  it('surfaces a 404 as an error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/collections/inconnue`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Collection not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useCollectionDetail('inconnue'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeUndefined();
  });
});
