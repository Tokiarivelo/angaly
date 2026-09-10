import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { CreationAvailability, type CreationDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCreationsGallery } from '../hooks/useCreationsGallery';
import type { GallerySort } from '../types/gallery.types';

const API_BASE_URL = 'http://localhost:3003/api';

function makeCreation(id: string): CreationDto {
  return {
    id,
    slug: id,
    name: `Création ${id}`,
    description: '',
    materials: null,
    techniques: null,
    availability: CreationAvailability.PIECE_UNIQUE,
    reproducible: true,
    isFeatured: false,
    featuredFrom: null,
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: null,
    media: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Two pages of 2 items each, driven by the request's `page` query param. */
function mockPaginatedCreations() {
  server.use(
    http.get(`${API_BASE_URL}/creations`, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
      const isFirstPage = page === 1;
      return HttpResponse.json({
        success: true,
        data: {
          data: isFirstPage ? [makeCreation('c1'), makeCreation('c2')] : [makeCreation('c3')],
          meta: {
            total: 3,
            page,
            limit: 2,
            totalPages: 2,
            hasNextPage: isFirstPage,
            hasPreviousPage: !isFirstPage,
          },
        },
      });
    }),
  );
}

describe('useCreationsGallery', () => {
  it('loads the first page and reports the real total', async () => {
    mockPaginatedCreations();
    const { result } = renderHook(() => useCreationsGallery('newest', null), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map((item) => item.id)).toEqual(['c1', 'c2']);
    expect(result.current.total).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('appends the next page on loadMore instead of replacing the list', async () => {
    mockPaginatedCreations();
    const { result } = renderHook(() => useCreationsGallery('newest', null), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual(['c1', 'c2', 'c3']),
    );
    expect(result.current.hasNextPage).toBe(false);
  });

  it('resets to page 1 when the sort changes', async () => {
    mockPaginatedCreations();
    const { result, rerender } = renderHook(
      ({ sort }: { sort: GallerySort }) => useCreationsGallery(sort, null),
      {
        wrapper: withQueryClient(),
        initialProps: { sort: 'newest' },
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    rerender({ sort: 'featured' });

    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['c1', 'c2']));
  });

  it('resets to page 1 when categoryId changes', async () => {
    mockPaginatedCreations();
    const { result, rerender } = renderHook(
      ({ categoryId }: { categoryId: string | null }) => useCreationsGallery('newest', categoryId),
      {
        wrapper: withQueryClient(),
        initialProps: { categoryId: null as string | null },
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    rerender({ categoryId: 'cat-1' });

    await waitFor(() => expect(result.current.items.map((item) => item.id)).toEqual(['c1', 'c2']));
  });

  it('forwards categoryId as a query param', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('categoryId')).toBe('cat-1');
        return HttpResponse.json({
          success: true,
          data: {
            data: [],
            meta: { total: 0, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });
      }),
    );
    const { result } = renderHook(() => useCreationsGallery('newest', 'cat-1'), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
