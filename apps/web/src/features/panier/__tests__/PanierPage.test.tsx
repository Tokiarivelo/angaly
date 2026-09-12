import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PanierPage } from '../ui/PanierPage';
import { useCartStore } from '@/stores/cart.store';

vi.mock('@/stores/cart.store', () => ({
  useCartStore: vi.fn(),
}));

describe('PanierPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart', () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [],
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      addItem: vi.fn(),
      clear: vi.fn(),
    });

    render(<PanierPage />);
    expect(screen.getByText('Votre panier est vide')).toBeInTheDocument();
  });

  it('renders cart items and summary', () => {
    vi.mocked(useCartStore).mockReturnValue({
      items: [
        {
          productId: 'p-1',
          variantId: 'v-1',
          name: 'Robe Solène',
          sku: 'SOL-01',
          size: '38',
          color: 'Ivoire',
          imageUrl: null,
          priceAmount: '1500000',
          currency: 'MGA',
          quantity: 2,
        },
      ],
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      addItem: vi.fn(),
      clear: vi.fn(),
    });

    render(<PanierPage />);
    expect(screen.getByText('Robe Solène')).toBeInTheDocument();
    expect(screen.getByText('Taille: 38 • Couleur: Ivoire')).toBeInTheDocument();
    expect(screen.getAllByText(/3\s*000\s*000\s*MGA/i)[0]).toBeInTheDocument();
  });
});
