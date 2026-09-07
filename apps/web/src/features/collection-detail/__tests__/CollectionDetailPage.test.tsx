import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CollectionDetailDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { CollectionDetailPage } from '../ui/CollectionDetailPage';

const API_BASE_URL = 'http://localhost:3003/api';

const COLLECTION: CollectionDetailDto = {
  id: 'col-1',
  slug: 'collection-eternelle',
  name: 'Collection Éternelle',
  description: "Où l'artisanat rencontre l'immortalité.",
  story: "Inspirée par l'architecture baroque.\n\nDes mois de broderie à la main ont été nécessaires.",
  seasonYear: 2026,
  publishedAt: '2026-01-01T00:00:00.000Z',
  media: [],
  creationsCount: 2,
  creations: [
    { id: 'c1', slug: 'eternite', name: "L'Éternité", coverImageUrl: null },
    { id: 'c2', slug: 'nuit-opera', name: "Nuit d'Opéra", coverImageUrl: 'https://cdn.example/nuit.jpg' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockDetail(overrides: Partial<CollectionDetailDto> = {}) {
  server.use(
    http.get(`${API_BASE_URL}/collections/collection-eternelle`, () =>
      HttpResponse.json({ success: true, data: { ...COLLECTION, ...overrides } }),
    ),
  );
}

describe('CollectionDetailPage', () => {
  it('renders the cover, story, gallery, and closing CTA once resolved', async () => {
    mockDetail();
    const Wrapper = withQueryClient();
    render(<CollectionDetailPage slug="collection-eternelle" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Collection Éternelle' })).toBeInTheDocument(),
    );

    expect(screen.getByText('Collection 2026')).toBeInTheDocument();
    expect(screen.getByText("L'histoire de la collection")).toBeInTheDocument();
    expect(screen.getByText("Inspirée par l'architecture baroque.")).toBeInTheDocument();
    expect(screen.getByText('Des mois de broderie à la main ont été nécessaires.')).toBeInTheDocument();

    expect(screen.getByText('Les créations de la collection')).toBeInTheDocument();
    expect(screen.getByText("L'Éternité")).toBeInTheDocument();
    expect(screen.getByText("Nuit d'Opéra")).toBeInTheDocument();
    expect(screen.getByRole('img', { name: "Nuit d'Opéra" })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /Vous souhaitez porter une pièce de cette collection/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir toutes les collections' })).toHaveAttribute('href', '/collections');
  });

  it('shows the empty gallery message when the collection has no creations', async () => {
    mockDetail({ creations: [], creationsCount: 0 });
    const Wrapper = withQueryClient();
    render(<CollectionDetailPage slug="collection-eternelle" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Aucune création publiée dans cette collection pour le moment.')).toBeInTheDocument(),
    );
  });

  it('shows a not-found message when the collection does not exist', async () => {
    server.use(
      http.get(`${API_BASE_URL}/collections/inconnue`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );
    const Wrapper = withQueryClient();
    render(<CollectionDetailPage slug="inconnue" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Cette collection est introuvable.')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Retour aux collections' })).toBeInTheDocument();
  });
});
