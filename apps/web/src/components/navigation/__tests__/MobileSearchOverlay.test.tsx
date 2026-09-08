import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { useMobileNavigationStore } from '@/stores/mobile-navigation.store';
import { withQueryClient } from '@/lib/test-utils';

import { MobileSearchOverlay } from '../MobileSearchOverlay';

const API_BASE_URL = 'http://localhost:3003/api';

beforeEach(() => {
  useMobileNavigationStore.setState({ isDrawerOpen: false, isSearchOpen: true });
});

describe('MobileSearchOverlay', () => {
  it('renders nothing when closed', () => {
    useMobileNavigationStore.setState({ isSearchOpen: false });
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });
    expect(screen.queryByPlaceholderText(/Rechercher une création/)).not.toBeInTheDocument();
  });

  it('shows the minimum-length hint before typing enough characters', () => {
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });
    expect(screen.getByText(/Saisissez au moins 2 caractères/)).toBeInTheDocument();
  });

  it('renders the 4 real suggestion chips', () => {
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });
    expect(screen.getByRole('button', { name: 'Robes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Costumes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accessoires' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atelier' })).toBeInTheDocument();
  });

  it('fetches and renders grouped results after typing, only for non-empty groups', async () => {
    server.use(
      http.get(`${API_BASE_URL}/search`, () =>
        HttpResponse.json({
          success: true,
          data: {
            creations: [
              { id: 'c1', slug: 'robe-eternelle', title: 'Robe Éternelle', excerpt: 'Collection Hiver', imageUrl: null },
            ],
            products: [],
            collections: [],
            blogPosts: [],
            ateliers: [],
          },
        }),
      ),
    );

    const user = userEvent.setup();
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Rechercher'), 'robe');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Robe Éternelle' })).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: 'Créations' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Articles' })).not.toBeInTheDocument();
  });

  it('shows a no-results message when every group is empty', async () => {
    server.use(
      http.get(`${API_BASE_URL}/search`, () =>
        HttpResponse.json({
          success: true,
          data: { creations: [], products: [], collections: [], blogPosts: [], ateliers: [] },
        }),
      ),
    );

    const user = userEvent.setup();
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Rechercher'), 'zzz');

    expect(await screen.findByText('Aucun résultat pour « zzz ».')).toBeInTheDocument();
  });

  it('clicking a suggestion chip fills the search input', async () => {
    const user = userEvent.setup();
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: 'Robes' }));

    expect(screen.getByLabelText('Rechercher')).toHaveValue('Robes');
  });

  it('closes on the close button', async () => {
    const user = userEvent.setup();
    render(<MobileSearchOverlay />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: 'Fermer la recherche' }));

    expect(useMobileNavigationStore.getState().isSearchOpen).toBe(false);
  });
});
