'use client';

import { Eye, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductAvailability, type ProductDto } from '@angaly/types';

import { getColorSwatchHex } from '@/lib/color-swatches';
import { formatPriceAriary } from '@/lib/utils';

import { ProductStatusBadge } from './ProductStatusBadge';

interface ProductCardProps {
  product: ProductDto;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onQuickView?: (product: ProductDto, initialColor?: string) => void;
}

/** Distinct colors across a product's variants, for the small swatch row — verified against the real Stitch card. */
function uniqueColorSwatches(product: ProductDto): string[] {
  return Array.from(new Set(product.variants.map((variant) => variant.color)));
}

export function ProductCard({ product, isFavorite, onToggleFavorite, onQuickView }: ProductCardProps) {
  const isOutOfStock = product.status === ProductAvailability.OUT_OF_STOCK;

  return (
    <div className="group relative flex flex-col">
      <div
        onClick={() => onQuickView?.(product)}
        className={`relative mb-6 aspect-[3/4] w-full cursor-pointer overflow-hidden bg-angaly-warm-ivory ${
          isOutOfStock ? 'opacity-75' : ''
        }`}
      >
        {product.media[0] && (
          <Image
            src={product.media[0].url}
            alt={product.media[0].altText || product.name}
            fill
            className={`object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${
              isOutOfStock ? 'grayscale-[20%]' : ''
            }`}
          />
        )}
        <ProductStatusBadge status={product.status} />

        {/* Favorite overlay button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className="absolute top-4 right-4 z-10 text-angaly-slate opacity-100 transition-colors duration-300 hover:text-angaly-navy md:opacity-0 md:group-hover:opacity-100"
        >
          <Heart className="h-5 w-5" aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Hover overlay button: Aperçu rapide */}
        <button
          type="button"
          aria-label={`Aperçu rapide — ${product.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onQuickView?.(product);
          }}
          className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-angaly-ivory/95 px-4 py-2 text-xs tracking-widest text-angaly-navy uppercase opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 hover:bg-white"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Aperçu rapide
        </button>
      </div>

      <div className="flex flex-grow flex-col">
        <div className="mb-2 flex items-start justify-between">
          <Link
            href={`/pret-a-porter/${product.slug}`}
            className="font-heading text-xl text-angaly-navy transition-colors hover:text-angaly-soft-navy"
          >
            {product.name}
          </Link>
          <span className="text-sm font-medium text-angaly-navy">
            {formatPriceAriary(Number(product.price.amount))}
          </span>
        </div>
        <span className="mb-4 text-xs tracking-widest text-angaly-slate uppercase">REF: {product.sku}</span>

        {/* Swatches: clicking a color opens quick view pre-selected with that color */}
        <div className="mt-auto flex items-center space-x-2">
          {uniqueColorSwatches(product).map((color) => (
            <button
              key={color}
              type="button"
              title={`Voir en ${color}`}
              aria-label={`Voir ${product.name} en ${color}`}
              onClick={() => onQuickView?.(product, color)}
              className={`h-3.5 w-3.5 rounded-full transition-transform hover:scale-125 focus:outline-none focus-visible:ring-1 focus-visible:ring-angaly-navy ${
                color === 'White' || color === 'Blanc' ? 'border border-angaly-border' : ''
              }`}
              style={{ backgroundColor: getColorSwatchHex(color) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
