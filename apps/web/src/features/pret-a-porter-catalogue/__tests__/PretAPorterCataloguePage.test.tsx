import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PretAPorterCataloguePage } from '../ui/PretAPorterCataloguePage';

const sampleFilters = {
  categoryId: undefined,
  size: undefined,
  color: undefined,
  material: undefined,
  status: undefined,
  priceMin: undefined,
  priceMax: undefined,
  sort: 'newest' as const,
  page: 1,
};

vi.mock('../hooks/useCatalogueFilters', () => ({
  useCatalogueFilters: () => ({
    filters: sampleFilters,
    setFilter: vi.fn(),
    setPage: vi.fn(),
    resetFilters: vi.fn(),
  }),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({
    items: [
      {
        id: 'product-1',
        sku: 'ANG-24-001',
        slug: 'robe-saphir',
        name: 'Robe Saphir',
        description: '',
        price: { amount: '2450000', currency: 'MGA' },
        status: 'AVAILABLE',
        category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
        media: [],
        variants: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    total: 1,
    totalPages: 1,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks/useToggleFavorite', () => ({
  useToggleFavorite: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../api/products.api', () => ({
  useCategoriesQuery: () => ({ data: [{ id: 'cat-1', slug: 'robes', name: 'Robes', kind: 'PRODUCT' }] }),
}));

describe('PretAPorterCataloguePage', () => {
  it('renders the header, filter sidebar, and product grid', () => {
    render(<PretAPorterCataloguePage />);

    expect(screen.getByRole('heading', { name: 'Prêt-à-porter' })).toBeInTheDocument();
    expect(screen.getByText('Robe Saphir')).toBeInTheDocument();
    expect(screen.getByText('1 Articles')).toBeInTheDocument();
  });
});
