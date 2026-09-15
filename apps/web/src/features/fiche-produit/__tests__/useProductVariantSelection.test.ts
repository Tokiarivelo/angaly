import { act, renderHook } from '@testing-library/react';
import type { ProductVariantDto } from '@angaly/types';
import { describe, expect, it } from 'vitest';

import { useProductVariantSelection } from '../hooks/useProductVariantSelection';

function variant(overrides: Partial<ProductVariantDto>): ProductVariantDto {
  return {
    id: `variant-${overrides.size}-${overrides.color}`,
    sku: 'SKU',
    size: '36',
    color: 'Bleu Nuit',
    material: null,
    priceOverride: null,
    quantityAvailable: 3,
    quantityReserved: 0,
    media: [],
    ...overrides,
  };
}

const VARIANTS: ProductVariantDto[] = [
  variant({ size: '36', color: 'Bleu Nuit', quantityAvailable: 3 }),
  variant({ size: '38', color: 'Champagne', quantityAvailable: 0 }),
  variant({ size: '40', color: 'Bleu Nuit', quantityAvailable: 1 }),
];

describe('useProductVariantSelection', () => {
  it('defaults to the first variant', () => {
    const { result } = renderHook(() => useProductVariantSelection(VARIANTS));

    expect(result.current.selectedSize).toBe('36');
    expect(result.current.selectedColor).toBe('Bleu Nuit');
    expect(result.current.selectedVariant?.id).toBe(VARIANTS[0]?.id);
  });

  it('lists distinct, sorted sizes and colors', () => {
    const { result } = renderHook(() => useProductVariantSelection(VARIANTS));

    expect(result.current.sizes).toEqual(['36', '38', '40']);
    expect(result.current.colors).toEqual(['Bleu Nuit', 'Champagne']);
  });

  it('reports a size as unavailable when its only variant has no stock', () => {
    const { result } = renderHook(() => useProductVariantSelection(VARIANTS));

    expect(result.current.isSizeAvailable('38')).toBe(false);
    expect(result.current.isSizeAvailable('36')).toBe(true);
  });

  it('resolves the variant matching the selected size + color', () => {
    const { result } = renderHook(() => useProductVariantSelection(VARIANTS));

    act(() => result.current.selectSize('40'));

    expect(result.current.selectedSize).toBe('40');
    expect(result.current.selectedColor).toBe('Bleu Nuit');
    expect(result.current.selectedVariant?.size).toBe('40');
  });

  it('falls back to a valid color when selecting a size with no variant for the current color', () => {
    const { result } = renderHook(() => useProductVariantSelection(VARIANTS));

    act(() => result.current.selectColor('Champagne'));
    expect(result.current.selectedColor).toBe('Champagne');
    // Only size 38 has Champagne — selecting it should keep Champagne selected.
    act(() => result.current.selectSize('38'));

    expect(result.current.selectedSize).toBe('38');
    expect(result.current.selectedColor).toBe('Champagne');
    expect(result.current.selectedVariant?.id).toBe(VARIANTS[1]?.id);
  });

  it('returns a null selectedVariant when there are no variants', () => {
    const { result } = renderHook(() => useProductVariantSelection([]));

    expect(result.current.selectedVariant).toBeNull();
    expect(result.current.sizes).toEqual([]);
  });
});
