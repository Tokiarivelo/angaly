import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { LaUnePage } from '../ui/LaUnePage';

const API_BASE_URL = 'http://localhost:3003/api';

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/la-une',
  useSearchParams: () => currentSearchParams,
}));

function mockThreeCreations() {
  server.use(
    http.get(`${API_BASE_URL}/creations`, () =>
      HttpResponse.json({
        success: true,
        data: {
          data: [
            {
              id: 'creation-1',
              slug: 'robe-eternelle',
              name: 'Robe Éternelle',
              description: 'Une robe de mariée intemporelle.',
              materials: null,
              techniques: null,
              availability: 'PIECE_UNIQUE',
              reproducible: true,
              isFeatured: true,
              featuredFrom: '2026-02-01T00:00:00.000Z',
              featuredUntil: null,
              category: { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée' },
              collection: null,
              media: [],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'creation-2',
              slug: 'tailleur-sur-mesure',
              name: 'Tailleur Sur Mesure',
              description: 'Le raffinement du costume masculin.',
              materials: null,
              techniques: null,
              availability: 'PIECE_UNIQUE',
              reproducible: true,
              isFeatured: true,
              featuredFrom: '2026-01-01T00:00:00.000Z',
              featuredUntil: null,
              category: { id: 'cat-2', slug: 'costumes', name: 'Costumes' },
              collection: null,
              media: [],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'creation-3',
              slug: 'dans-l-atelier',
              name: "Dans l'Atelier",
              description: "Découvrez l'envers du décor de nos artisans.",
              materials: null,
              techniques: null,
              availability: 'PIECE_UNIQUE',
              reproducible: true,
              isFeatured: true,
              featuredFrom: '2025-12-01T00:00:00.000Z',
              featuredUntil: null,
              category: { id: 'cat-3', slug: 'coulisses', name: 'Coulisses' },
              collection: null,
              media: [],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          meta: {
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      }),
    ),
  );
}

describe('LaUnePage', () => {
  beforeEach(() => {
    push.mockReset();
    currentSearchParams = new URLSearchParams();
  });

  it('renders the editorial header, filter bar, hero, and closing CTA', async () => {
    const Wrapper = withQueryClient();
    render(<LaUnePage />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'LA UNE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tout' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Robe Éternelle')).toBeInTheDocument());

    expect(
      screen.getByRole('heading', { name: /Envie de porter une création Angaly/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toBeInTheDocument();
  });

  it('changes route when clicking a filter pill', async () => {
    mockThreeCreations();
    const Wrapper = withQueryClient();
    render(<LaUnePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Robe Éternelle')).toBeInTheDocument());
    expect(screen.getByText('Tailleur Sur Mesure')).toBeInTheDocument();
    expect(screen.getByText("Dans l'Atelier")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Coulisses' }));

    expect(push).toHaveBeenCalledWith('/la-une?type=coulisses', { scroll: false });
  });

  it('filters the grid according to URL search params while always keeping the hero visible', async () => {
    currentSearchParams = new URLSearchParams('type=coulisses');
    mockThreeCreations();
    const Wrapper = withQueryClient();
    render(<LaUnePage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Robe Éternelle')).toBeInTheDocument());
    // The hero stays visible regardless of the grid filter.
    expect(screen.getByText('Robe Éternelle')).toBeInTheDocument();
    // Only the coulisses item is shown in the grid
    expect(screen.getByText("Dans l'Atelier")).toBeInTheDocument();
    expect(screen.queryByText('Tailleur Sur Mesure')).not.toBeInTheDocument();
  });
});
