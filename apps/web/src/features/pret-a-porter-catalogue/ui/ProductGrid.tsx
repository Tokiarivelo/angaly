import type { ProductDto } from '@angaly/types';

import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductDto[];
  isFavorite: (productId: string) => boolean;
  onToggleFavorite: (productId: string) => void;
}

/** 3 columns desktop / 2 mobile — verified against the real Stitch screen (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`). */
export function ProductGrid({ products, isFavorite, onToggleFavorite }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-16 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={isFavorite(product.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
