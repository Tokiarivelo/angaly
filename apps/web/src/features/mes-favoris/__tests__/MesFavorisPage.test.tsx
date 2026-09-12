import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MesFavorisPage } from '../ui/MesFavorisPage';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteEntityType } from '@angaly/types';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: vi.fn(),
}));

vi.mock('../hooks/useRemoveFavorite', () => ({
  useRemoveFavorite: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('MesFavorisPage', () => {
  it('renders empty state when there are no favorites', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<MesFavorisPage />);

    expect(screen.getByText("Vous n'avez pas encore de favoris")).toBeInTheDocument();
  });

  it('renders favorites grid and CTA when there are favorites', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [
        {
          id: '1',
          entityType: FavoriteEntityType.CREATION,
          entityId: 'c1',
          createdAt: '2023-01-01',
          display: { name: 'Robe Éternelle', slug: 'robe-eternelle', imageUrl: null },
        },
      ],
      isLoading: false,
    } as any);

    render(<MesFavorisPage />);

    expect(screen.getByText('Robe Éternelle')).toBeInTheDocument();
    expect(screen.getByText('Préparer un rendez-vous avec mes favoris')).toBeInTheDocument();
  });
});
