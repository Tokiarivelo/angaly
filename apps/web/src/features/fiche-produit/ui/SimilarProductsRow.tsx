import type { ProductDto } from '@angaly/types';

import { ProductCard } from '@/features/pret-a-porter-catalogue/ui/ProductCard';

interface SimilarProductsRowProps {
  products: ProductDto[];
  isFavorite: (productId: string) => boolean;
  onToggleFavorite: (productId: string) => void;
}

/**
 * Reuses pret-a-porter-catalogue's ProductCard, per this page's own spec
 * ("réutilise ProductCard de pret-a-porter-catalogue") — the one sanctioned
 * cross-feature import in this codebase's otherwise feature-isolated
 * convention. The real Stitch screen shows a simpler name+price-only card
 * here, but the full ProductCard (status badge + favorite) is a superset
 * that doesn't contradict anything the mockup decided.
 */
export function SimilarProductsRow({ products, isFavorite, onToggleFavorite }: SimilarProductsRowProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 mb-16 lg:mt-32">
      <h2 className="mb-12 text-center font-heading text-3xl text-angaly-navy italic">Vous aimerez aussi</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={isFavorite(product.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
