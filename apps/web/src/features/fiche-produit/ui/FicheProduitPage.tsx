'use client';

import Link from 'next/link';
import type { ProductDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

import { useProduct } from '../hooks/useProduct';
import { useProductVariantSelection } from '../hooks/useProductVariantSelection';
import { useSimilarProducts } from '../hooks/useSimilarProducts';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { ProductDetailsTabs } from './ProductDetailsTabs';
import { ProductGallery } from './ProductGallery';
import { PurchasePanel } from './PurchasePanel';
import { SimilarProductsRow } from './SimilarProductsRow';

interface FicheProduitPageProps {
  slug: string;
}

/** Orchestrates the real "ANGALY — Robe Solène (Product Page)" screen. */
export function FicheProduitPage({ slug }: FicheProduitPageProps) {
  const { product, isLoading, isError } = useProduct(slug);

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-angaly-slate">Chargement…</p>;
  }

  if (isError || !product) {
    return <p className="py-24 text-center text-sm text-angaly-error">Ce produit n’a pas pu être trouvé.</p>;
  }

  return <FicheProduitContent product={product} />;
}

/**
 * Split out so `useProductVariantSelection` only mounts once `product` (and
 * therefore its real variant list) is loaded — its initial size/color pick
 * is derived once, on mount, from the variants it's given, so mounting it
 * earlier with an empty placeholder array would leave the selection stuck
 * on nothing once the real data arrives.
 *
 * The selection is owned here rather than inside `PurchasePanel` so
 * `ProductGallery` can swap to the selected color's photos too — gallery and
 * purchase panel are siblings that both need the same `selectedVariant`.
 */
function FicheProduitContent({ product }: { product: ProductDto }) {
  const { products: similarProducts } = useSimilarProducts(product.category.id, product.id);
  const { isFavorite, toggleFavorite } = useToggleFavorite();
  const variantSelection = useProductVariantSelection(product.variants);

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-6 py-8 md:px-12">
      <nav aria-label="Fil d'Ariane" className="mb-8 text-xs text-angaly-slate">
        <ol className="inline-flex items-center space-x-2">
          <li>
            <Link href={ROUTES.home} className="transition-colors hover:text-angaly-navy">
              Accueil
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <Link href={ROUTES.pretAPorter} className="transition-colors hover:text-angaly-navy">
              Prêt-à-porter
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <span>{product.category.name}</span>
          </li>
          <li className="flex items-center gap-2 text-angaly-navy">
            <span>/</span>
            <span>{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery product={product} selectedVariant={variantSelection.selectedVariant} />
        </div>
        <div className="lg:col-span-5">
          <PurchasePanel product={product} variantSelection={variantSelection} />
        </div>
      </div>

      <div className="mt-24 lg:mt-32">
        <ProductDetailsTabs product={product} />
      </div>

      <SimilarProductsRow products={similarProducts} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
    </main>
  );
}
