import { ProductAvailability, type ProductVariantDto } from '@angaly/types';
import { describe, expect, it } from 'vitest';

import { resolveVariantStatus } from '../ui/PurchasePanel';

function variant(quantityAvailable: number, quantityReserved: number): ProductVariantDto {
  return {
    id: 'variant-1',
    sku: 'SKU',
    size: '36',
    color: 'Bleu Nuit',
    material: null,
    priceOverride: null,
    quantityAvailable,
    quantityReserved,
    media: [],
  };
}

describe('resolveVariantStatus', () => {
  it('returns OUT_OF_STOCK when the selected variant has no real stock, even if the product is AVAILABLE', () => {
    expect(resolveVariantStatus(ProductAvailability.AVAILABLE, variant(0, 0))).toBe(ProductAvailability.OUT_OF_STOCK);
  });

  it('returns OUT_OF_STOCK when reserved quantity consumes all available stock', () => {
    expect(resolveVariantStatus(ProductAvailability.LAST_PIECE, variant(2, 2))).toBe(ProductAvailability.OUT_OF_STOCK);
  });

  it('falls back to the product-level status when the variant has real stock', () => {
    expect(resolveVariantStatus(ProductAvailability.LAST_PIECE, variant(1, 0))).toBe(ProductAvailability.LAST_PIECE);
  });

  it('falls back to the product-level status when no variant is selected', () => {
    expect(resolveVariantStatus(ProductAvailability.ON_ORDER, null)).toBe(ProductAvailability.ON_ORDER);
  });
});
