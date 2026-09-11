import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { CreationAvailability, type CreationDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { CreationDetailPage } from '../ui/CreationDetailPage';

const API_BASE_URL = 'http://localhost:3003/api';

const CREATION: CreationDto = {
  id: 'creation-1',
  slug: 'robe-eternelle',
  name: 'Robe Éternelle',
  description: "L'incarnation du raffinement intemporel.",
  materials: 'Satin duchesse de soie',
  techniques: "Broderie d'art à l'aiguille",
  genre: 'Femme',
  type: 'Mariée',
  color: 'Blanc',
  style: 'Classique',
  availability: CreationAvailability.PIECE_UNIQUE,
  reproducible: false,
  isFeatured: true,
  featuredFrom: null,
  featuredUntil: null,
  category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
  collection: { id: 'col-1', slug: 'collection-eternelle', name: 'Collection Éternelle' },
  media: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function relatedCreation(id: string, name: string): CreationDto {
  return { ...CREATION, id, slug: id, name };
}

function mockDetail(overrides: Partial<CreationDto> = {}) {
  server.use(
    http.get(`${API_BASE_URL}/creations/robe-eternelle`, () =>
      HttpResponse.json({ success: true, data: { ...CREATION, ...overrides } }),
    ),
  );
}

function mockRelated() {
  server.use(
    http.get(`${API_BASE_URL}/creations`, ({ request }) => {
      const url = new URL(request.url);
      const collectionId = url.searchParams.get('collectionId');
      const categoryId = url.searchParams.get('categoryId');
      const data = collectionId
        ? [CREATION, relatedCreation('c2', 'Veste Architecturale')]
        : categoryId
          ? [CREATION, relatedCreation('c3', 'Robe Majesté')]
          : [];
      return HttpResponse.json({
        success: true,
        data: {
          data,
          meta: {
            total: data.length,
            page: 1,
            limit: 5,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });
    }),
  );
}

describe('CreationDetailPage', () => {
  it('renders the breadcrumb, info panel, and appointment band once resolved', async () => {
    mockDetail();
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Robe Éternelle' })).toBeInTheDocument(),
    );

    expect(screen.getByText('Robes de mariée')).toBeInTheDocument();
    expect(screen.getByText('Satin duchesse de soie')).toBeInTheDocument();
    expect(screen.getByText('Pièce unique')).toBeInTheDocument();
    // One in the info panel actions, one in the closing appointment band.
    expect(screen.getAllByRole('link', { name: 'Prendre rendez-vous' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Créer une version personnalisée' })).toHaveAttribute(
      'href',
      '/creations/robe-eternelle/personnaliser',
    );
    expect(screen.getByText('Le savoir-faire derrière cette création')).toBeInTheDocument();
    expect(screen.getByText(/Envie d.essayer cette création/)).toBeInTheDocument();
  });

  it('shows the related collection row and the "you may also like" grid with real data', async () => {
    mockDetail();
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Fait partie de la collection')).toBeInTheDocument(),
    );
    expect(screen.getByText('Veste Architecturale')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Vous aimerez aussi')).toBeInTheDocument());
    expect(screen.getByText('Robe Majesté')).toBeInTheDocument();
  });

  it('hides the related collection row when the creation has no collection', async () => {
    mockDetail({ collection: null });
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.queryByText('Fait partie de la collection')).not.toBeInTheDocument();
  });

  it('toggles the favorite button', async () => {
    mockDetail();
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const user = userEvent.setup();
    const saveButton = screen.getByRole('button', { name: 'Sauvegarder' });
    expect(saveButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(saveButton);
    expect(saveButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the main image when a thumbnail is clicked (multiple media)', async () => {
    mockDetail({
      media: [
        { id: 'm1', url: 'https://cdn.example/1.jpg', altText: 'Vue de face', sortOrder: 0 },
        { id: 'm2', url: 'https://cdn.example/2.jpg', altText: 'Vue arrière', sortOrder: 1 },
      ],
    });
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const secondThumbnail = screen.getByRole('button', { name: "Voir l'image 2" });
    expect(secondThumbnail).toHaveAttribute('aria-current', 'false');

    const user = userEvent.setup();
    await user.click(secondThumbnail);

    expect(secondThumbnail).toHaveAttribute('aria-current', 'true');
    // Both the main image and the now-active thumbnail show the selected picture.
    expect(screen.getAllByAltText('Vue arrière')).toHaveLength(2);
  });

  it('opens the lightbox on the main image and cycles to the next image', async () => {
    mockDetail({
      media: [
        { id: 'm1', url: 'https://cdn.example/1.jpg', altText: 'Vue de face', sortOrder: 0 },
        { id: 'm2', url: 'https://cdn.example/2.jpg', altText: 'Vue arrière', sortOrder: 1 },
      ],
    });
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: "Agrandir l'image" }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Image suivante' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "Fermer l'aperçu" }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('copies the share link to the clipboard when the Web Share API is unavailable', async () => {
    mockDetail();
    mockRelated();
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="robe-eternelle" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    // userEvent.setup() installs its own clipboard stub — override it after,
    // not before, or userEvent's stub silently wins.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await user.click(screen.getByRole('button', { name: 'Partager' }));

    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByText('Lien copié !')).toBeInTheDocument();
  });

  it('shows a not-found message when the creation does not exist', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations/inconnue`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Not found' }, statusCode: 404 },
          { status: 404 },
        ),
      ),
    );
    const Wrapper = withQueryClient();
    render(<CreationDetailPage slug="inconnue" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Cette création est introuvable.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Retour à nos créations' })).toBeInTheDocument();
  });
});
