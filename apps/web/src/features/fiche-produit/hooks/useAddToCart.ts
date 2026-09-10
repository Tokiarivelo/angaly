'use client';

import { useState } from 'react';
import type { ProductDto, ProductVariantDto } from '@angaly/types';

import { useCartStore } from '@/stores/cart.store';

/**
 * No `api/cart.api.ts` on purpose: `POST /api/cart/items` doesn't exist —
 * cart is explicitly out of scope for `products` until `orders` ships
 * (Phase 3, see docs/features/products.md "Points d'attention"). Works for
 * a signed-out visitor too, per docs/pages/fiche-produit.md — the cart is
 * local/session-only (Zustand + localStorage) regardless of auth state.
 */
export function useAddToCart(product: ProductDto): {
  addToCart: (variant: ProductVariantDto, quantity: number) => void;
  justAdded: boolean;
} {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const addToCart = (variant: ProductVariantDto, quantity: number) => {
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      sku: product.sku,
      size: variant.size,
      color: variant.color,
      imageUrl: product.media[0]?.url ?? null,
      priceAmount: variant.priceOverride?.amount ?? product.price.amount,
      currency: variant.priceOverride?.currency ?? product.price.currency,
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return { addToCart, justAdded };
}
