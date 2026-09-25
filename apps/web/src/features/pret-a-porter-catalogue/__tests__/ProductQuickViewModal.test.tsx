import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductAvailability, type ProductDto } from '@angaly/types';

import { useCartStore } from '@/stores/cart.store';
import { ProductQuickViewModal } from '../ui/ProductQuickViewModal';

const sampleProduct: ProductDto = {
  id: 'prod-quick-1',
  sku: 'ANG-24-001',
  slug: 'robe-saphir',
  name: 'Robe Saphir',
  description: 'Une superbe robe en soie naturelle brodée.',
  price: { amount: '2450000', currency: 'MGA' },
  status: ProductAvailability.AVAILABLE,
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [{ id: 'pm-1', url: '/default-image.jpg', altText: 'Default', isPrimary: true, sortOrder: 0 }],
  variants: [
    {
      id: 'var-noir-36',
      sku: 'ANG-24-001-NOIR-36',
      size: '36',
      color: 'Noir',
      material: '100% Soie',
      priceOverride: null,
      quantityAvailable: 3,
      quantityReserved: 0,
      media: [{ id: 'vm-noir', url: '/robe-noir.jpg', altText: 'Robe Noir', isPrimary: true, sortOrder: 0 }],
    },
    {
      id: 'var-noir-38',
      sku: 'ANG-24-001-NOIR-38',
      size: '38',
      color: 'Noir',
      material: '100% Soie',
      priceOverride: null,
      quantityAvailable: 0,
      quantityReserved: 0,
      media: [{ id: 'vm-noir', url: '/robe-noir.jpg', altText: 'Robe Noir', isPrimary: true, sortOrder: 0 }],
    },
    {
      id: 'var-blanc-36',
      sku: 'ANG-24-001-BLANC-36',
      size: '36',
      color: 'Blanc',
      material: '100% Soie',
      priceOverride: null,
      quantityAvailable: 5,
      quantityReserved: 0,
      media: [{ id: 'vm-blanc', url: '/robe-blanc.jpg', altText: 'Robe Blanc', isPrimary: true, sortOrder: 0 }],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductQuickViewModal', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('renders nothing when product is null', () => {
    const { container } = render(
      <ProductQuickViewModal product={null} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders product details and initial colorway photo', () => {
    render(<ProductQuickViewModal product={sampleProduct} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Robe Saphir' })).toBeInTheDocument();
    expect(screen.getByText('Robes')).toBeInTheDocument();
    expect(screen.getByText('Une superbe robe en soie naturelle brodée.')).toBeInTheDocument();
    expect(screen.getByText('Matière : 100% Soie')).toBeInTheDocument();
    expect(screen.getByText('En stock')).toBeInTheDocument();

    const img = screen.getByAltText(/Robe Noir/i);
    expect(img).toHaveAttribute('src', expect.stringContaining('robe-noir.jpg'));
  });

  it('swaps the garment image and variant details when clicking a different color swatch', () => {
    render(<ProductQuickViewModal product={sampleProduct} onClose={vi.fn()} />);

    const blancSwatch = screen.getByRole('button', { name: 'Couleur Blanc' });
    fireEvent.click(blancSwatch);

    const updatedImg = screen.getByAltText(/Robe Blanc/i);
    expect(updatedImg).toHaveAttribute('src', expect.stringContaining('robe-blanc.jpg'));
    expect(screen.getByText('RÉF : ANG-24-001-BLANC-36')).toBeInTheDocument();
  });

  it('updates quantity and adds selected variant to cart', () => {
    render(<ProductQuickViewModal product={sampleProduct} onClose={vi.fn()} />);

    const increaseBtn = screen.getByRole('button', { name: 'Augmenter la quantité' });
    fireEvent.click(increaseBtn);

    expect(screen.getByText('2')).toBeInTheDocument();

    const addToCartBtn = screen.getByRole('button', { name: 'Ajouter au panier' });
    fireEvent.click(addToCartBtn);

    const cartItems = useCartStore.getState().items;
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0]?.variantId).toBe('var-noir-36');
    expect(cartItems[0]?.quantity).toBe(2);
    expect(cartItems[0]?.color).toBe('Noir');
    expect(cartItems[0]?.size).toBe('36');
    expect(cartItems[0]?.imageUrl).toBe('/robe-noir.jpg');
  });

  it('disables unavailable size for the chosen colorway', () => {
    render(<ProductQuickViewModal product={sampleProduct} onClose={vi.fn()} />);

    // In Noir, size 38 has quantityAvailable: 0
    const size38Btn = screen.getByRole('button', { name: 'Taille 38 — épuisée' });
    expect(size38Btn).toBeDisabled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ProductQuickViewModal product={sampleProduct} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: "Fermer l'aperçu rapide" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
