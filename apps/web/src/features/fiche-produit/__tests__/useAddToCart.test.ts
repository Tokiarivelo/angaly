import { act, renderHook } from '@testing-library/react';
import type { ProductDto, ProductVariantDto } from '@angaly/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCartStore } from '@/stores/cart.store';

import { useAddToCart } from '../hooks/useAddToCart';

const PRODUCT: ProductDto = {
  id: 'product-1',
  sku: 'AGL-RS-014',
  slug: 'robe-solene',
  name: 'Robe Solène',
  description: '',
  price: { amount: '890000', currency: 'MGA' },
  status: 'AVAILABLE' as ProductDto['status'],
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [{ id: 'media-1', url: 'http://localhost:9000/products/a.jpg', altText: '', sortOrder: 0 }],
  variants: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const VARIANT: ProductVariantDto = {
  id: 'variant-1',
  sku: 'AGL-RS-014-36',
  size: '36',
  color: 'Bleu Nuit',
  material: null,
  priceOverride: null,
  quantityAvailable: 3,
  quantityReserved: 0,
};

describe('useAddToCart', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    vi.useRealTimers();
  });

  it('adds a new line to the cart store', () => {
    const { result } = renderHook(() => useAddToCart(PRODUCT));

    act(() => result.current.addToCart(VARIANT, 2));

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: 'product-1', variantId: 'variant-1', quantity: 2, size: '36' });
  });

  it('merges quantity when the same variant is added again', () => {
    const { result } = renderHook(() => useAddToCart(PRODUCT));

    act(() => result.current.addToCart(VARIANT, 1));
    act(() => result.current.addToCart(VARIANT, 2));

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(3);
  });

  it('sets justAdded to true right after adding, for confirmation feedback', () => {
    const { result } = renderHook(() => useAddToCart(PRODUCT));

    expect(result.current.justAdded).toBe(false);

    act(() => result.current.addToCart(VARIANT, 1));

    expect(result.current.justAdded).toBe(true);
  });
});
