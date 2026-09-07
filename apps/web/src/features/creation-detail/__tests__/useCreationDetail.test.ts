import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCreationDetail } from '../hooks/useCreationDetail';

const API_BASE_URL = 'http://localhost:3001/api';

describe('useCreationDetail', () => {
  it('starts loading with no data', () => {
    const { result } = renderHook(() => useCreationDetail('robe-eternelle'), { wrapper: withQueryClient() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('resolves with the creation matching the slug', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations/robe-eternelle`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: 'creation-1',
            slug: 'robe-eternelle',
            name: 'Robe Éternelle',
            description: 'Une robe de mariée intemporelle.',
            materials: 'Satin duchesse',
            techniques: null,
            availability: 'PIECE_UNIQUE',
            reproducible: false,
            isFeatured: true,
            featuredFrom: null,
            featuredUntil: null,
            category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
            collection: null,
            media: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
      ),
    );

    const { result } = renderHook(() => useCreationDetail('robe-eternelle'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data?.name).toBe('Robe Éternelle');
  });

  it('surfaces a 404 as an error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations/inconnue`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Creation not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreationDetail('inconnue'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeUndefined();
  });
});
