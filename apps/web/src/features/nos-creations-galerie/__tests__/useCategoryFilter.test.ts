import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { CategoryKind, type CategoryDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCategoryFilter } from '../hooks/useCategoryFilter';

const API_BASE_URL = 'http://localhost:3003/api';

const CATEGORIES: CategoryDto[] = [
  { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: CategoryKind.CREATION },
];

describe('useCategoryFilter', () => {
  it('starts with an empty list while loading', () => {
    server.use(http.get(`${API_BASE_URL}/categories`, () => HttpResponse.json({ success: true, data: [] })));
    const { result } = renderHook(() => useCategoryFilter(), { wrapper: withQueryClient() });

    expect(result.current.categories).toEqual([]);
  });

  it('exposes the real categories once loaded', async () => {
    server.use(
      http.get(`${API_BASE_URL}/categories`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('kind')).toBe('CREATION');
        return HttpResponse.json({ success: true, data: CATEGORIES });
      }),
    );
    const { result } = renderHook(() => useCategoryFilter(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categories).toEqual(CATEGORIES);
  });
});
