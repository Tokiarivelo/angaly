import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FicheProduitPage } from '../ui/FicheProduitPage';

const sampleProduct = {
  id: 'product-1',
  sku: 'AGL-RS-014',
  slug: 'robe-solene',
  name: 'Robe Solène',
  description: 'Une robe intemporelle.',
  price: { amount: '890000', currency: 'MGA' },
  status: 'AVAILABLE',
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [],
  variants: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('../hooks/useProduct', () => ({
  useProduct: () => ({ product: sampleProduct, isLoading: false, isError: false }),
}));

vi.mock('../hooks/useSimilarProducts', () => ({
  useSimilarProducts: () => ({ products: [], isLoading: false }),
}));

vi.mock('../hooks/useToggleFavorite', () => ({
  useToggleFavorite: () => ({ isFavorite: () => false, toggleFavorite: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useProductVariantSelection', () => ({
  useProductVariantSelection: () => ({
    sizes: [],
    colors: [],
    selectedSize: null,
    selectedColor: null,
    selectedVariant: null,
    isSizeAvailable: () => true,
    selectSize: vi.fn(),
    selectColor: vi.fn(),
  }),
}));

vi.mock('../hooks/useAddToCart', () => ({
  useAddToCart: () => ({ addToCart: vi.fn(), justAdded: false }),
}));

describe('FicheProduitPage', () => {
  it('renders the breadcrumb, product name, and purchase panel once resolved', () => {
    render(<FicheProduitPage slug="robe-solene" />);

    expect(screen.getByRole('heading', { name: 'Robe Solène' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Réf. AGL-RS-014')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prêt-à-porter' })).toBeInTheDocument();
  });
});
