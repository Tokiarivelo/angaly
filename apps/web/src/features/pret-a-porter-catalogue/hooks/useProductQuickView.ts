'use client';

import { useState } from 'react';
import type { ProductDto } from '@angaly/types';

export interface UseProductQuickViewResult {
  quickViewProduct: ProductDto | null;
  initialColor: string | null;
  isOpen: boolean;
  openQuickView: (product: ProductDto, color?: string) => void;
  closeQuickView: () => void;
}

/**
 * Manages the modal state for the quick view preview in the Prêt-à-porter catalogue.
 * Supports opening with an optional initial colorway pre-selected.
 */
export function useProductQuickView(): UseProductQuickViewResult {
  const [quickViewProduct, setQuickViewProduct] = useState<ProductDto | null>(null);
  const [initialColor, setInitialColor] = useState<string | null>(null);

  const openQuickView = (product: ProductDto, color?: string) => {
    setQuickViewProduct(product);
    setInitialColor(color ?? null);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    setInitialColor(null);
  };

  return {
    quickViewProduct,
    initialColor,
    isOpen: quickViewProduct !== null,
    openQuickView,
    closeQuickView,
  };
}
