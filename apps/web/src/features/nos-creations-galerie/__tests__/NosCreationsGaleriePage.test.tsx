import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { CreationAvailability, type CreationDto } from '@angaly/types';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { NosCreationsGaleriePage } from '../ui/NosCreationsGaleriePage';

const API_BASE_URL = 'http://localhost:3003/api';

function makeCreation(id: string): CreationDto {
  return {
    id,
    slug: id,
    name: `Création ${id}`,
    description: '',
    materials: 'Soie et dentelle',
    techniques: null,
    genre: 'Femme',
    type: 'Mariée',
    color: 'Blanc',
    style: 'Classique',
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

function mockCreations(items: CreationDto[], hasNextPage = false) {
  server.use(
    http.get(`${API_BASE_URL}/creations`, () =>
      HttpResponse.json({
        success: true,
        data: {
          data: items,
          meta: {
            total: items.length,
            page: 1,
            limit: 12,
            totalPages: 1,
            hasNextPage,
            hasPreviousPage: false,
          },
        },
      }),
    ),
  );
}

describe('NosCreationsGaleriePage', () => {
  it('renders the header, results count, and gallery cards once resolved', async () => {
    mockCreations([makeCreation('c1'), makeCreation('c2')]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'Nos Créations' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('2 créations')).toBeInTheDocument());
    expect(screen.getByText('Création c1')).toBeInTheDocument();
    expect(screen.getAllByText('Soie et dentelle')).toHaveLength(2);
  });

  it('shows the empty state when no creation matches', async () => {
    mockCreations([]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText('Aucune création ne correspond à ces filtres pour le moment.'),
      ).toBeInTheDocument(),
    );
  });

  it('toggles a card into favorites and changes the sort order', async () => {
    mockCreations([makeCreation('c1')]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    const favoriteButton = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    await user.click(favoriteButton);
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.selectOptions(screen.getByLabelText('Trier par'), 'featured');
    expect(screen.getByLabelText('Trier par')).toHaveValue('featured');
  });

  it('switches to the list view on toggle click', async () => {
    mockCreations([makeCreation('c1')]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    const listButton = screen.getByRole('button', { name: 'Vue liste' });
    await user.click(listButton);

    expect(listButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the quick view modal from a card and closes it', async () => {
    mockCreations([makeCreation('c1')]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Aperçu rapide' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Création c1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "Fermer l'aperçu rapide" }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the mobile filter sheet from the "Filtrer" button', async () => {
    mockCreations([makeCreation('c1')]);
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Filtrer' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Genre')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Voir les résultats' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters by category, forwards categoryId to the API, and shows an active filter chip', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations`, ({ request }) => {
        const categoryId = new URL(request.url).searchParams.get('categoryId');
        const items = categoryId === 'cat-default-1' ? [makeCreation('c1')] : [makeCreation('c1'), makeCreation('c2')];
        return HttpResponse.json({
          success: true,
          data: {
            data: items,
            meta: { total: items.length, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });
      }),
    );
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('2 créations')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Réinitialiser les filtres' })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Catégorie' }), 'cat-default-1');

    await waitFor(() => expect(screen.getByText('1 création')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Robes de mariée/ })).toBeInTheDocument();
  });

  it('resets the category filter from the active filter chip', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations`, ({ request }) => {
        const categoryId = new URL(request.url).searchParams.get('categoryId');
        const items = categoryId === 'cat-default-1' ? [makeCreation('c1')] : [makeCreation('c1'), makeCreation('c2')];
        return HttpResponse.json({
          success: true,
          data: {
            data: items,
            meta: { total: items.length, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });
      }),
    );
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('2 créations')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Catégorie' }), 'cat-default-1');
    await waitFor(() => expect(screen.getByText('1 création')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));

    await waitFor(() => expect(screen.getByText('2 créations')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Robes de mariée/ })).not.toBeInTheDocument();
  });

  it('resets filters from the empty state button', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations`, ({ request }) => {
        const categoryId = new URL(request.url).searchParams.get('categoryId');
        const items = categoryId === 'cat-default-1' ? [] : [makeCreation('c1')];
        return HttpResponse.json({
          success: true,
          data: {
            data: items,
            meta: { total: items.length, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });
      }),
    );
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Catégorie' }), 'cat-default-1');

    await waitFor(() =>
      expect(
        screen.getByText('Aucune création ne correspond à ces filtres pour le moment.'),
      ).toBeInTheDocument(),
    );

    // Both the active filter chip row and the empty state render their own
    // "Réinitialiser les filtres" button while a category is selected —
    // either one calls the same resetFilters(), click the empty state's.
    const resetButtons = screen.getAllByRole('button', { name: 'Réinitialiser les filtres' });
    await user.click(resetButtons[resetButtons.length - 1]!);

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());
  });

  it('loads more creations on click without a page reload', async () => {
    server.use(
      http.get(`${API_BASE_URL}/creations`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        const isFirstPage = page === 1;
        return HttpResponse.json({
          success: true,
          data: {
            data: [makeCreation(isFirstPage ? 'c1' : 'c2')],
            meta: {
              total: 2,
              page,
              limit: 1,
              totalPages: 2,
              hasNextPage: isFirstPage,
              hasPreviousPage: !isFirstPage,
            },
          },
        });
      }),
    );
    const Wrapper = withQueryClient();
    render(<NosCreationsGaleriePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Création c1')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Voir plus de créations' }));

    await waitFor(() => expect(screen.getByText('Création c2')).toBeInTheDocument());
    // Both stay mounted — this was progressive loading, not a replace.
    expect(screen.getByText('Création c1')).toBeInTheDocument();
  });
});
