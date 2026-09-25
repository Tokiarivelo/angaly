import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductAvailability, type ProductDto } from '@angaly/types';

import { useProductQuickView } from '../hooks/useProductQuickView';

const dummyProduct: ProductDto = {
  id: 'prod-1',
  sku: 'ANG-24-001',
  slug: 'robe-saphir',
  name: 'Robe Saphir',
  description: 'Élégante robe en soie',
  price: { amount: '2450000', currency: 'MGA' },
  status: ProductAvailability.AVAILABLE,
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [],
  variants: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useProductQuickView', () => {
  it('initializes with closed state and null product', () => {
    const { result } = renderHook(() => useProductQuickView());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.quickViewProduct).toBeNull();
    expect(result.current.initialColor).toBeNull();
  });

  it('opens quick view with product and optional initial color', () => {
    const { result } = renderHook(() => useProductQuickView());

    act(() => {
      result.current.openQuickView(dummyProduct, 'Bleu Nuit');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.quickViewProduct).toEqual(dummyProduct);
    expect(result.current.initialColor).toBe('Bleu Nuit');
  });

  it('closes quick view and resets state', () => {
    const { result } = renderHook(() => useProductQuickView());

    act(() => {
      result.current.openQuickView(dummyProduct);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeQuickView();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.quickViewProduct).toBeNull();
    expect(result.current.initialColor).toBeNull();
  });
});
