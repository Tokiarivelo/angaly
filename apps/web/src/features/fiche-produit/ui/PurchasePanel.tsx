'use client';

import { useState } from 'react';
import { ProductAvailability, type ProductDto, type ProductVariantDto } from '@angaly/types';

import { formatPriceAriary } from '@/lib/utils';

import { useAddToCart } from '../hooks/useAddToCart';
import type { UseProductVariantSelectionResult } from '../hooks/useProductVariantSelection';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { ColorSelector } from './ColorSelector';
import { ProductActionsGroup } from './ProductActionsGroup';
import { ProductStatusIndicator } from './ProductStatusIndicator';
import { QuantityStepper } from './QuantityStepper';
import { SizeSelector } from './SizeSelector';

const MAX_QUANTITY_PER_LINE = 5;

/**
 * `ProductVariant` has no status field of its own (only raw inventory
 * numbers) — the real per-variant statuses docs/pages/fiche-produit.md
 * describes ("Dernière pièce en M mais Épuisé en S") aren't backed by a
 * dedicated enum per variant. This derives the closest honest
 * approximation: a variant with no real stock always shows OUT_OF_STOCK
 * regardless of the product's global status; otherwise the product-level
 * status applies (it's the only granularity the schema actually has).
 */
export function resolveVariantStatus(productStatus: ProductAvailability, variant: ProductVariantDto | null): ProductAvailability {
  if (variant && variant.quantityAvailable - variant.quantityReserved <= 0) {
    return ProductAvailability.OUT_OF_STOCK;
  }
  return productStatus;
}

interface PurchasePanelProps {
  product: ProductDto;
  variantSelection: UseProductVariantSelectionResult;
}

/**
 * Verified against the real Stitch screen: kicker + H1 + ref, price/status
 * row, selectors, material note, actions — sticky on desktop.
 *
 * Variant selection state (`variantSelection`) is owned by `FicheProduitPage`,
 * not this component — `ProductGallery` needs the same `selectedVariant` to
 * swap its photos when the color changes, so the two siblings share one hook
 * instance instead of drifting out of sync.
 */
export function PurchasePanel({ product, variantSelection }: PurchasePanelProps) {
  const { sizes, colors, selectedSize, selectedColor, selectedVariant, isSizeAvailable, selectSize, selectColor } =
    variantSelection;
  const { addToCart, justAdded } = useAddToCart(product);
  const { isFavorite, toggleFavorite } = useToggleFavorite();
  const [quantity, setQuantity] = useState(1);

  const price = selectedVariant?.priceOverride ?? product.price;
  const material = selectedVariant?.material;
  const effectiveStatus = resolveVariantStatus(product.status, selectedVariant);

  return (
    <div className="flex flex-col gap-8 lg:sticky lg:top-32">
      <div>
        <span className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">Prêt-à-porter</span>
        <h1 className="mb-2 font-heading text-4xl leading-tight text-angaly-navy lg:text-5xl">{product.name}</h1>
        <p className="text-xs text-angaly-slate">Réf. {product.sku}</p>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-xl text-angaly-navy">{formatPriceAriary(Number(price.amount))}</span>
        <ProductStatusIndicator status={effectiveStatus} />
      </div>

      <hr className="border-angaly-border" />

      <div className="flex flex-col gap-6">
        <SizeSelector sizes={sizes} selectedSize={selectedSize} isSizeAvailable={isSizeAvailable} onSelect={selectSize} />
        <ColorSelector colors={colors} selectedColor={selectedColor} onSelect={selectColor} />
        <div>
          <span className="mb-3 block text-sm tracking-wider text-angaly-navy uppercase">Quantité</span>
          <QuantityStepper quantity={quantity} max={MAX_QUANTITY_PER_LINE} onChange={setQuantity} />
        </div>
      </div>

      {material && (
        <p className="border-l-2 border-angaly-champagne pl-4 text-sm text-angaly-slate italic">Matière : {material}</p>
      )}

      <ProductActionsGroup
        productId={product.id}
        productStatus={effectiveStatus}
        selectedVariant={selectedVariant}
        isFavorite={isFavorite(product.id)}
        justAddedToCart={justAdded}
        onAddToCart={() => selectedVariant && addToCart(selectedVariant, quantity)}
        onToggleFavorite={() => toggleFavorite(product.id)}
      />
    </div>
  );
}
