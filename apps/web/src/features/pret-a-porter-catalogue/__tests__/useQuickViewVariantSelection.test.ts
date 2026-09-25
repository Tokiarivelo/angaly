import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductAvailability, type ProductDto, type ProductVariantDto } from '@angaly/types';

import { useQuickViewVariantSelection } from '../hooks/useQuickViewVariantSelection';

function createVariant(overrides: Partial<ProductVariantDto>): ProductVariantDto {
  return {
    id: `var-${overrides.color}-${overrides.size}`,
    sku: `SKU-${overrides.color}-${overrides.size}`,
    size: '36',
    color: 'Noir',
    material: 'Soie',
    priceOverride: null,
    quantityAvailable: 5,
    quantityReserved: 0,
    media: [],
    ...overrides,
  };
}

const mockProduct: ProductDto = {
  id: 'prod-test',
  sku: 'ANG-TEST-01',
  slug: 'robe-test',
  name: 'Robe Test',
  description: 'Description test',
  price: { amount: '1000000', currency: 'MGA' },
  status: ProductAvailability.AVAILABLE,
  category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
  media: [
    { id: 'prod-media-1', url: '/images/product-default.jpg', altText: 'Default', isPrimary: true, sortOrder: 0 },
  ],
  variants: [
    createVariant({
      size: '36',
      color: 'Noir',
      quantityAvailable: 2,
      media: [{ id: 'm-noir-1', url: '/images/robe-noir-1.jpg', altText: 'Noir 1', isPrimary: true, sortOrder: 0 }],
    }),
    createVariant({
      size: '38',
      color: 'Noir',
      quantityAvailable: 0,
      media: [{ id: 'm-noir-1', url: '/images/robe-noir-1.jpg', altText: 'Noir 1', isPrimary: true, sortOrder: 0 }],
    }),
    createVariant({
      size: '38',
      color: 'Blanc',
      quantityAvailable: 4,
      media: [
        { id: 'm-blanc-1', url: '/images/robe-blanc-1.jpg', altText: 'Blanc 1', isPrimary: true, sortOrder: 0 },
        { id: 'm-blanc-2', url: '/images/robe-blanc-2.jpg', altText: 'Blanc 2', isPrimary: false, sortOrder: 1 },
      ],
    }),
    createVariant({
      size: '40',
      color: 'Blanc',
      quantityAvailable: 3,
      media: [],
    }),
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useQuickViewVariantSelection', () => {
  it('defaults to the first variant and its colorway image', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(mockProduct));

    expect(result.current.selectedColor).toBe('Noir');
    expect(result.current.selectedSize).toBe('36');
    expect(result.current.selectedVariant?.id).toBe('var-Noir-36');
    expect(result.current.activeImage?.url).toBe('/images/robe-noir-1.jpg');
    expect(result.current.colors).toEqual(['Noir', 'Blanc']);
    expect(result.current.sizes).toEqual(['36', '38', '40']);
  });

  it('respects initialColor parameter when provided', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(mockProduct, 'Blanc'));

    expect(result.current.selectedColor).toBe('Blanc');
    expect(result.current.selectedSize).toBe('38');
    expect(result.current.activeImage?.url).toBe('/images/robe-blanc-1.jpg');
  });

  it('swaps the garment visual image when selecting a different color', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(mockProduct));

    expect(result.current.selectedColor).toBe('Noir');
    expect(result.current.activeImage?.url).toBe('/images/robe-noir-1.jpg');

    act(() => {
      result.current.selectColor('Blanc');
    });

    expect(result.current.selectedColor).toBe('Blanc');
    expect(result.current.activeImage?.url).toBe('/images/robe-blanc-1.jpg');
    expect(result.current.media.length).toBe(2);
  });

  it('supports cycling through thumbnails for the selected colorway', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(mockProduct, 'Blanc'));

    expect(result.current.activeImageIndex).toBe(0);
    expect(result.current.activeImage?.url).toBe('/images/robe-blanc-1.jpg');

    act(() => {
      result.current.setActiveImageIndex(1);
    });

    expect(result.current.activeImageIndex).toBe(1);
    expect(result.current.activeImage?.url).toBe('/images/robe-blanc-2.jpg');

    // Selecting another color resets activeImageIndex back to 0
    act(() => {
      result.current.selectColor('Noir');
    });
    expect(result.current.activeImageIndex).toBe(0);
    expect(result.current.activeImage?.url).toBe('/images/robe-noir-1.jpg');
  });

  it('correctly calculates size availability for the active color', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(mockProduct));

    // In Noir: size 36 is in stock (qty 2), size 38 has qty 0
    expect(result.current.isSizeAvailable('36')).toBe(true);
    expect(result.current.isSizeAvailable('38')).toBe(false);

    // Switch to Blanc: size 38 has qty 4 (in stock), size 40 has qty 3 (in stock)
    act(() => {
      result.current.selectColor('Blanc');
    });
    expect(result.current.isSizeAvailable('38')).toBe(true);
    expect(result.current.isSizeAvailable('40')).toBe(true);
  });

  it('handles null product gracefully', () => {
    const { result } = renderHook(() => useQuickViewVariantSelection(null));

    expect(result.current.colors).toEqual([]);
    expect(result.current.sizes).toEqual([]);
    expect(result.current.selectedColor).toBeNull();
    expect(result.current.selectedSize).toBeNull();
    expect(result.current.selectedVariant).toBeNull();
    expect(result.current.activeImage).toBeNull();
  });
});
