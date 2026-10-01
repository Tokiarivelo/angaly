import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductAvailability, type ProductDto } from '@angaly/types';

import { ProductCard } from '../ui/ProductCard';

const mockProduct: ProductDto = {
  id: 'prod-card-1',
  sku: 'ANG-24-001',
  slug: 'robe-saphir',
  name: 'Robe Saphir',
  description: 'Élégante robe.',
  price: { amount: '2450000', currency: 'MGA' },
  status: ProductAvailability.AVAILABLE,
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [{ id: 'm-1', url: '/robe.jpg', altText: 'Robe Saphir', sortOrder: 0 }],
  variants: [
    {
      id: 'v-1',
      sku: 'ANG-24-001-N-36',
      size: '36',
      color: 'Navy',
      material: null,
      priceOverride: null,
      quantityAvailable: 2,
      quantityReserved: 0,
      media: [],
    },
    {
      id: 'v-2',
      sku: 'ANG-24-001-B-36',
      size: '36',
      color: 'White',
      material: null,
      priceOverride: null,
      quantityAvailable: 1,
      quantityReserved: 0,
      media: [],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} isFavorite={false} onToggleFavorite={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Robe Saphir' })).toHaveAttribute(
      'href',
      '/pret-a-porter/robe-saphir',
    );
    expect(screen.getByText('REF: ANG-24-001')).toBeInTheDocument();
    expect(screen.getByText(/2\s*450\s*000/)).toBeInTheDocument();
  });

  it('triggers onQuickView when clicking on the product card image', () => {
    const onQuickView = vi.fn();
    render(
      <ProductCard
        product={mockProduct}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        onQuickView={onQuickView}
      />,
    );

    const imageBtn = screen.getByRole('button', { name: "Aperçu rapide — Robe Saphir" });
    fireEvent.click(imageBtn);

    expect(onQuickView).toHaveBeenCalledWith(mockProduct);
  });

  it('triggers onQuickView with specific color when clicking on a color swatch', () => {
    const onQuickView = vi.fn();
    render(
      <ProductCard
        product={mockProduct}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        onQuickView={onQuickView}
      />,
    );

    const whiteSwatch = screen.getByRole('button', { name: 'Voir Robe Saphir en White' });
    fireEvent.click(whiteSwatch);

    expect(onQuickView).toHaveBeenCalledWith(mockProduct, 'White');
  });

  it('toggles favorite without triggering onQuickView', () => {
    const onToggleFavorite = vi.fn();
    const onQuickView = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
        onQuickView={onQuickView}
      />,
    );

    const favBtn = screen.getByRole('button', { name: 'Ajouter aux favoris' });
    fireEvent.click(favBtn);

    expect(onToggleFavorite).toHaveBeenCalledWith('prod-card-1');
    expect(onQuickView).not.toHaveBeenCalled();
  });
});
