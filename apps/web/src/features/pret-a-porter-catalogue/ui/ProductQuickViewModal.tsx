'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Check, Heart, Minus, Plus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ProductAvailability, type ProductDto, type ProductVariantDto } from '@angaly/types';

import { getColorSwatchHex } from '@/lib/color-swatches';
import { formatPriceAriary } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';

import { PRODUCT_STATUS_INDICATOR } from '../consts/queryKeys';
import { useQuickViewVariantSelection } from '../hooks/useQuickViewVariantSelection';
import { ProductStatusBadge } from './ProductStatusBadge';

export function resolveVariantStatus(
  productStatus: ProductAvailability,
  variant: ProductVariantDto | null,
): ProductAvailability {
  if (variant && variant.quantityAvailable - variant.quantityReserved <= 0) {
    return ProductAvailability.OUT_OF_STOCK;
  }
  return productStatus;
}

interface ProductQuickViewModalProps {
  product: ProductDto | null;
  initialColor?: string | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductQuickViewModal({
  product,
  initialColor,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: ProductQuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const {
    colors,
    sizes,
    selectedColor,
    selectedSize,
    selectedVariant,
    media,
    activeImage,
    activeImageIndex,
    setActiveImageIndex,
    isSizeAvailable,
    selectColor,
    selectSize,
  } = useQuickViewVariantSelection(product, initialColor);

  const addItem = useCartStore((state) => state.addItem);

  if (!product) {
    return null;
  }

  const price = selectedVariant?.priceOverride ?? product.price;
  const effectiveStatus = resolveVariantStatus(product.status, selectedVariant);
  const statusInfo = PRODUCT_STATUS_INDICATOR[effectiveStatus];

  const isUnavailable =
    effectiveStatus === ProductAvailability.OUT_OF_STOCK || effectiveStatus === ProductAvailability.RESERVED;
  const canAddToCart = Boolean(selectedVariant) && !isUnavailable;

  const maxQuantity = selectedVariant
    ? Math.min(5, Math.max(1, selectedVariant.quantityAvailable - selectedVariant.quantityReserved))
    : 1;

  const handleAddToCart = () => {
    if (!selectedVariant || !canAddToCart) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      color: selectedVariant.color,
      imageUrl: activeImage?.url ?? product.media[0]?.url ?? null,
      priceAmount: price.amount,
      currency: price.currency,
      quantity,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-angaly-navy/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[70] flex max-h-[92vh] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-sm border border-angaly-border/50 bg-angaly-ivory shadow-2xl md:flex-row md:overflow-hidden"
        >
          <Dialog.Title className="sr-only">Aperçu rapide — {product.name}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fermer l'aperçu rapide"
              className="absolute top-4 right-4 z-20 rounded-full bg-angaly-ivory/80 p-2 text-angaly-navy backdrop-blur-sm transition-colors hover:bg-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Close>

          {/* Left Column: Visual Image and Colorway Photos */}
          <div className="relative aspect-[3/4] w-full shrink-0 bg-angaly-warm-ivory md:w-1/2">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? `${product.name} — ${selectedColor ?? ''}`}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-opacity duration-300"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
              />
            )}

            <ProductStatusBadge status={effectiveStatus} />

            {/* Thumbnails if multiple images exist for this colorway/product */}
            {media.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto rounded-sm bg-angaly-navy/30 p-2 backdrop-blur-md">
                {media.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    aria-label={`Afficher la photo ${index + 1}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-xs border transition-all ${
                      index === activeImageIndex
                        ? 'border-white ring-1 ring-white'
                        : 'border-white/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.altText || product.name}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Selectors */}
          <div className="flex w-full flex-col justify-between overflow-y-auto p-6 md:w-1/2 md:p-8">
            <div className="flex flex-col gap-4">
              <div>
                <span className="w-fit rounded-sm bg-angaly-warm-ivory px-3 py-1 text-xs font-medium tracking-widest text-angaly-navy uppercase">
                  {product.category.name}
                </span>
                <h2 className="mt-2 font-heading text-2xl text-angaly-navy md:text-3xl">{product.name}</h2>
                <span className="mt-1 block text-xs tracking-widest text-angaly-slate uppercase">
                  RÉF : {selectedVariant?.sku ?? product.sku}
                </span>
              </div>

              {/* Price and status row */}
              <div className="flex items-center justify-between border-b border-angaly-border/60 pb-3">
                <span className="text-2xl font-medium text-angaly-navy">
                  {formatPriceAriary(Number(price.amount))}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClassName}`} aria-hidden="true" />
                  <span className={`text-xs font-medium tracking-wider uppercase ${statusInfo.textClassName}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="line-clamp-3 text-sm leading-relaxed text-angaly-slate">
                  {product.description}
                </p>
              )}

              {/* Color selection — triggers live visual update of the garment */}
              {colors.length > 0 && (
                <div>
                  <span className="mb-2 block text-xs font-semibold tracking-wider text-angaly-navy uppercase">
                    Couleur{selectedColor ? ` : ${selectedColor}` : ''}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const isSelected = color === selectedColor;
                      const hex = getColorSwatchHex(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Couleur ${color}`}
                          aria-pressed={isSelected}
                          onClick={() => selectColor(color)}
                          className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                            isSelected
                              ? 'ring-2 ring-angaly-navy ring-offset-2 ring-offset-angaly-ivory'
                              : 'hover:scale-105'
                          }`}
                        >
                          <span
                            className={`h-7 w-7 rounded-full border border-angaly-border/80 ${
                              hex === '#FFFFFF' ? 'border-angaly-border' : ''
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size selection */}
              {sizes.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-angaly-navy uppercase">
                      Taille (FR)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const isSelected = size === selectedSize;
                      const available = isSizeAvailable(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!available}
                          aria-pressed={isSelected}
                          aria-label={available ? `Taille ${size}` : `Taille ${size} — épuisée`}
                          onClick={() => selectSize(size)}
                          className={`flex h-10 min-w-10 items-center justify-center px-3 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-angaly-navy text-white'
                              : available
                                ? 'border border-angaly-border bg-white text-angaly-navy hover:border-angaly-navy'
                                : 'cursor-not-allowed border border-angaly-border/50 bg-transparent text-angaly-slate/40 line-through'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Material information */}
              {selectedVariant?.material && (
                <p className="border-l-2 border-angaly-champagne pl-3 text-xs italic text-angaly-slate">
                  Matière : {selectedVariant.material}
                </p>
              )}

              {/* Quantity stepper */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold tracking-wider text-angaly-navy uppercase">
                  Quantité
                </span>
                <div className="flex items-center border border-angaly-border bg-white">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isUnavailable}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="flex h-9 w-9 items-center justify-center text-angaly-navy disabled:opacity-30"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-angaly-navy" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxQuantity || isUnavailable}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    aria-label="Augmenter la quantité"
                    className="flex h-9 w-9 items-center justify-center text-angaly-navy disabled:opacity-30"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions group */}
            <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-angaly-border/60">
              <button
                type="button"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-angaly-navy py-3.5 text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-angaly-navy-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Ajouté au panier ✓
                  </>
                ) : isUnavailable ? (
                  'Épuisé'
                ) : (
                  'Ajouter au panier'
                )}
              </button>

              <div className="flex gap-2">
                <Link
                  href={`/pret-a-porter/${product.slug}`}
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-angaly-navy py-2.5 text-xs font-medium tracking-wider text-angaly-navy uppercase transition-colors hover:bg-angaly-navy hover:text-white"
                >
                  <span>Voir la fiche complète</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onClick={() => onToggleFavorite?.(product.id)}
                  className="flex items-center justify-center rounded-sm border border-angaly-border px-3.5 py-2.5 text-angaly-navy transition-colors hover:border-angaly-navy"
                >
                  <Heart
                    className="h-4 w-4"
                    aria-hidden="true"
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
