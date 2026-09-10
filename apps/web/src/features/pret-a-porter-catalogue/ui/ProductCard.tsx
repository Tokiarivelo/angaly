'use client';

import { Heart } from 'lucide-react';
import Image from 'next/image';
import { ProductAvailability, type ProductDto } from '@angaly/types';

import { getColorSwatchHex } from '@/lib/color-swatches';
import { formatPriceAriary } from '@/lib/utils';

import { ProductStatusBadge } from './ProductStatusBadge';

interface ProductCardProps {
  product: ProductDto;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

/** Distinct colors across a product's variants, for the small swatch row — verified against the real Stitch card. */
function uniqueColorSwatches(product: ProductDto): string[] {
  return Array.from(new Set(product.variants.map((variant) => variant.color)));
}

export function ProductCard({ product, isFavorite, onToggleFavorite }: ProductCardProps) {
  const isOutOfStock = product.status === ProductAvailability.OUT_OF_STOCK;

  return (
    <div className="group relative flex flex-col">
      <div
        className={`relative mb-6 aspect-[3/4] w-full overflow-hidden bg-angaly-warm-ivory ${isOutOfStock ? 'opacity-75' : ''}`}
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
        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className="absolute top-4 right-4 text-angaly-slate opacity-100 transition-colors duration-300 hover:text-angaly-navy md:opacity-0 md:group-hover:opacity-100"
        >
          <Heart className="h-5 w-5" aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-grow flex-col">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-heading text-xl text-angaly-navy">{product.name}</h3>
          <span className="text-sm font-medium text-angaly-navy">{formatPriceAriary(Number(product.price.amount))}</span>
        </div>
        <span className="mb-4 text-xs tracking-widest text-angaly-slate uppercase">REF: {product.sku}</span>
        <div className="mt-auto flex space-x-2">
          {uniqueColorSwatches(product).map((color) => (
            <div
              key={color}
              title={color}
              className={`h-3 w-3 rounded-full ${color === 'White' || color === 'Blanc' ? 'border border-angaly-border' : ''}`}
              style={{ backgroundColor: getColorSwatchHex(color) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
