'use client';

import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

import { DECORATIVE_FILTER_LABELS, SORT_OPTIONS } from '../consts/gallery-filters.const';
import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { useMobileFilterSheet } from '../hooks/useMobileFilterSheet';
import type { GallerySort, GalleryView } from '../types/gallery.types';
import { MobileFilterSheet } from './MobileFilterSheet';

function DecorativeFilter({ label }: { label: string }) {
  return (
    <div
      className="hover:text-angaly-champagne flex cursor-not-allowed items-center gap-1 text-sm tracking-wider text-angaly-navy uppercase transition-colors"
      title="Filtre à venir — aucune donnée réelle ne le supporte encore"
    >
      <span>{label}</span>
      <ChevronDown className="h-[18px] w-[18px]" aria-hidden="true" />
    </div>
  );
}

function CategorySelect({
  categories,
  categoryId,
  onCategoryChange,
}: {
  categories: CategoryDto[];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}) {
  return (
    <select
      aria-label="Catégorie"
      value={categoryId ?? ''}
      onChange={(event) => onCategoryChange(event.target.value || null)}
      className="hover:text-angaly-champagne cursor-pointer border-none bg-transparent text-sm tracking-wider text-angaly-navy uppercase transition-colors focus:outline-none"
    >
      <option value="">Catégorie</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Real Stitch screen's sticky filter bar. Sort + view + Catégorie (the only
 * real filter — see gallery-filters.const.ts) are wired; Genre/Type/Couleur/
 * Style stay decorative. Below `md:` the whole cluster collapses into a
 * single "Filtrer" button opening `MobileFilterSheet` (real Stitch "MOBILE
 * BEHAVIOR" text) — "Trier par" stays visible at every breakpoint, matching
 * the real HTML (only the grid/list toggle is `hidden md:flex` there).
 */
export function FilterBar({
  sort,
  onSortChange,
  view,
  onViewChange,
  categoryId,
  onCategoryChange,
}: {
  sort: GallerySort;
  onSortChange: (sort: GallerySort) => void;
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}) {
  const { isOpen: isSheetOpen, open: openSheet, close: closeSheet } = useMobileFilterSheet();
  const { categories } = useCategoryFilter();

  return (
    <div className="border-angaly-border sticky top-16 z-40 flex w-full flex-wrap items-center justify-between gap-4 border-y bg-angaly-ivory/95 px-8 py-4 backdrop-blur-md md:px-16">
      <div className="hidden flex-wrap items-center gap-6 md:flex">
        {DECORATIVE_FILTER_LABELS.slice(0, 2).map((label) => (
          <DecorativeFilter key={label} label={label} />
        ))}
        <CategorySelect categories={categories} categoryId={categoryId} onCategoryChange={onCategoryChange} />
        {DECORATIVE_FILTER_LABELS.slice(2).map((label) => (
          <DecorativeFilter key={label} label={label} />
        ))}
      </div>

      <button
        type="button"
        onClick={openSheet}
        className="hover:text-angaly-champagne flex items-center gap-2 text-sm tracking-wider text-angaly-navy uppercase transition-colors md:hidden"
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
        Filtrer
      </button>

      <div className="flex items-center gap-6 text-sm text-angaly-slate">
        <label className="flex items-center gap-1">
          <span>Trier par</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as GallerySort)}
            className="hover:text-angaly-navy cursor-pointer border-none bg-transparent text-sm text-angaly-slate transition-colors focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="border-angaly-border hidden gap-2 border-l pl-6 md:flex">
          <button
            type="button"
            aria-label="Vue grille"
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
            className={view === 'grid' ? 'text-angaly-navy' : 'hover:text-angaly-navy text-angaly-slate transition-colors'}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Vue liste"
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            className={view === 'list' ? 'text-angaly-navy' : 'hover:text-angaly-navy text-angaly-slate transition-colors'}
          >
            <List className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileFilterSheet
        isOpen={isSheetOpen}
        onClose={closeSheet}
        categories={categories}
        categoryId={categoryId}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}
