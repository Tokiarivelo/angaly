import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CollectionDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { CollectionsListePage } from '../ui/CollectionsListePage';

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

describe('CollectionsListePage', () => {
  it('renders the header, featured banner, and grid with real data', async () => {
    mockCollections([
      makeCollection(),
      makeCollection({ id: 'col-2', slug: 'lart-de-la-dentelle', name: 'L’Art de la Dentelle', seasonYear: 2026 }),
      makeCollection({ id: 'col-3', slug: 'renaissance', name: 'Renaissance', seasonYear: null }),
    ]);

    const Wrapper = withQueryClient();
    render(<CollectionsListePage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'Nos Collections' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Collection du moment')).toBeInTheDocument());
    expect(screen.getAllByText('Collection Éternelle')).toHaveLength(1);
    expect(screen.getByText('12')).toBeInTheDocument();

    // The featured collection isn't repeated in the grid below.
    expect(screen.getByText('L’Art de la Dentelle')).toBeInTheDocument();
    expect(screen.getByText('Renaissance')).toBeInTheDocument();
    expect(screen.getByText('Archives')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('renders a real cover photo when the collection has media', async () => {
    mockCollections([
      makeCollection(),
      makeCollection({
        id: 'col-2',
        slug: 'lart-de-la-dentelle',
        name: 'L’Art de la Dentelle',
        media: [{ id: 'm1', url: 'https://cdn.example/cover.jpg', altText: 'Couverture', sortOrder: 0 }],
      }),
    ]);

    const Wrapper = withQueryClient();
    render(<CollectionsListePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('L’Art de la Dentelle')).toBeInTheDocument());
    expect(screen.getByRole('img', { name: 'Couverture' })).toBeInTheDocument();
  });

  it('shows the empty grid message when no other collection is published', async () => {
    mockCollections([makeCollection()]);

    const Wrapper = withQueryClient();
    render(<CollectionsListePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Collection du moment')).toBeInTheDocument());
    expect(screen.getByText('Aucune collection publiée pour le moment.')).toBeInTheDocument();
  });

  it('hides the featured banner entirely when no collection is published', async () => {
    mockCollections([]);

    const Wrapper = withQueryClient();
    render(<CollectionsListePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Aucune collection publiée pour le moment.')).toBeInTheDocument());
    expect(screen.queryByText('Collection du moment')).not.toBeInTheDocument();
  });
});
