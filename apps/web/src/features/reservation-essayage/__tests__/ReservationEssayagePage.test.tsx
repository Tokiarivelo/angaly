import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/lib/test-utils';

import { ReservationEssayagePage } from '../ui/ReservationEssayagePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/essayage/reserver',
  useSearchParams: () => new URLSearchParams('productId=product-1&size=36'),
}));

describe('ReservationEssayagePage', () => {
  it('renders the reservation form heading and the submit CTA', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ReservationEssayagePage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Réserver un essayage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sélectionnez votre taille' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer la réservation' })).toBeInTheDocument();
  });
});
