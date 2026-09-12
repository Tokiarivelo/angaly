import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckoutWizard } from '../ui/CheckoutWizard';

vi.mock('@/stores/cart.store', () => ({
  useCartStore: () => ({
    items: [],
    clear: vi.fn(),
  }),
}));

describe('CheckoutWizard', () => {
  it('renders the checkout header and expedition step initially', () => {
    render(<CheckoutWizard />);
    expect(screen.getByText('Paiement sécurisé')).toBeInTheDocument();
    expect(screen.getByText('Coordonnées')).toBeInTheDocument();
    expect(screen.getByText('Mode de livraison')).toBeInTheDocument();
  });
});
