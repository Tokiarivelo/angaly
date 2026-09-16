import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { CheckoutWizard } from '../ui/CheckoutWizard';
import { createTestQueryClient } from '@/lib/test-utils';

vi.mock('@/stores/cart.store', () => ({
  useCartStore: () => ({
    items: [],
    clear: vi.fn(),
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

describe('CheckoutWizard', () => {
  it('renders the checkout header and expedition step initially', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutWizard />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Paiement sécurisé')).toBeInTheDocument();
    expect(screen.getByText('Coordonnées')).toBeInTheDocument();
    expect(screen.getByText('Mode de livraison')).toBeInTheDocument();
  });
});
