'use client';

import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useProduct } from '../hooks/useProduct';
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
  const { products: similarProducts } = useSimilarProducts(product?.category.id, product?.id);
  const { isFavorite, toggleFavorite } = useToggleFavorite();

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-angaly-slate">Chargement…</p>;
  }

  if (isError || !product) {
    return <p className="py-24 text-center text-sm text-angaly-error">Ce produit n’a pas pu être trouvé.</p>;
  }

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
          <ProductGallery product={product} />
        </div>
        <div className="lg:col-span-5">
          <PurchasePanel product={product} />
        </div>
      </div>

      <div className="mt-24 lg:mt-32">
        <ProductDetailsTabs product={product} />
      </div>

      <SimilarProductsRow products={similarProducts} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
    </main>
  );
}
