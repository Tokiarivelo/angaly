'use client';

import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useCategoriesQuery } from '../api/products.api';
import { CATALOGUE_SORT_OPTIONS } from '../consts/queryKeys';
import { useCatalogueFilters } from '../hooks/useCatalogueFilters';
import { useProducts } from '../hooks/useProducts';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { CatalogueFilterBar } from './CatalogueFilterBar';
import { MobileFilterSheet } from './MobileFilterSheet';
import { ProductGrid } from './ProductGrid';

/** Orchestrates the real "ANGALY — Prêt-à-porter Catalogue" screen: sidebar filters + toolbar + grid + pagination. */
export function PretAPorterCataloguePage() {
  const { filters, setFilter, setPage, resetFilters } = useCatalogueFilters();
  const { items, total, totalPages, isLoading, isError } = useProducts(filters);
  const categoriesQuery = useCategoriesQuery();
  const { isFavorite, toggleFavorite } = useToggleFavorite();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = categoriesQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-12">
      <header className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="font-heading text-5xl text-angaly-navy italic md:text-6xl">Prêt-à-porter</h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed tracking-wide text-angaly-slate md:text-base">
          Des pièces raffinées, disponibles immédiatement, sans compromis sur l’élégance.
        </p>
      </header>

      <div className="flex flex-col gap-12 lg:flex-row">
        <aside className="hidden w-full flex-shrink-0 lg:block lg:w-64">
          <div className="sticky top-28">
            <CatalogueFilterBar
              filters={filters}
              categories={categories}
              setFilter={setFilter}
              resetFilters={resetFilters}
            />
          </div>
        </aside>

        <div className="flex-grow">
          <div className="mb-8 flex items-center justify-between border-b border-angaly-border pb-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-2 text-sm text-angaly-navy lg:hidden"
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filtrer
              </button>
              <span className="text-sm text-angaly-slate">{total} Articles</span>
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="catalogue-sort" className="text-xs tracking-widest text-angaly-slate uppercase">
                Trier par
              </label>
              <select
                id="catalogue-sort"
                value={filters.sort}
                onChange={(event) => setFilter('sort', event.target.value)}
                className="cursor-pointer border-none bg-transparent pr-8 text-sm text-angaly-navy focus:ring-0"
              >
                {CATALOGUE_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isError && (
            <p role="alert" className="text-sm text-angaly-error">
              Une erreur est survenue, veuillez réessayer dans quelques instants.
            </p>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <p className="py-24 text-center text-sm text-angaly-slate">Aucun article ne correspond à ces filtres.</p>
          )}

          {items.length > 0 && <ProductGrid products={items} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />}

          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-center space-x-4">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setPage(filters.page - 1)}
                aria-label="Page précédente"
                className="flex h-10 w-10 items-center justify-center border border-angaly-border text-angaly-slate transition-colors hover:border-angaly-navy hover:text-angaly-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="text-sm text-angaly-navy">
                {filters.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page >= totalPages}
                onClick={() => setPage(filters.page + 1)}
                aria-label="Page suivante"
                className="flex h-10 w-10 items-center justify-center border border-angaly-border text-angaly-slate transition-colors hover:border-angaly-navy hover:text-angaly-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <MobileFilterSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        categories={categories}
        setFilter={setFilter}
        resetFilters={resetFilters}
      />
    </main>
  );
}
