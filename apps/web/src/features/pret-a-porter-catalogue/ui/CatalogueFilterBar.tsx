'use client';

import type { CategoryDto } from '@angaly/types';

import type { CatalogueFiltersValues } from '../schemas/catalogue-filters.schema';
import { CATALOGUE_COLOR_FILTERS, CATALOGUE_SIZES, CATALOGUE_STATUS_LABELS } from '../consts/queryKeys';

interface CatalogueFilterBarProps {
  filters: CatalogueFiltersValues;
  categories: CategoryDto[];
  setFilter: (key: keyof CatalogueFiltersValues, value: string | undefined) => void;
  resetFilters: () => void;
}

const SECTION_TITLE_CLASS = 'font-body text-xs font-medium tracking-widest text-angaly-navy uppercase';

/**
 * Sidebar filters — verified against the real Stitch screen (left sidebar,
 * not the horizontal bar the prompt memo described). Only Catégorie/Taille/
 * Couleur are shown in the captured screen; Matière/Disponibilité/Prix are
 * added below in the same visual language since the page spec and the
 * `products` backend both support them and nothing in the mockup precludes
 * it — see docs/pages/pret-a-porter-catalogue.md "Points d'attention".
 */
export function CatalogueFilterBar({ filters, categories, setFilter, resetFilters }: CatalogueFilterBarProps) {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-angaly-border pb-4">
        <h2 className="font-heading text-lg tracking-widest text-angaly-navy uppercase">Filtres</h2>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs tracking-wider text-angaly-slate uppercase hover:text-angaly-navy"
        >
          Réinitialiser
        </button>
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Catégorie</h3>
        <ul className="space-y-3 text-sm text-angaly-slate">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center space-x-3">
              <input
                id={`cat-${category.id}`}
                type="checkbox"
                checked={filters.categoryId === category.id}
                onChange={() => setFilter('categoryId', filters.categoryId === category.id ? undefined : category.id)}
                className="rounded-sm border-angaly-border bg-transparent text-angaly-navy focus:ring-angaly-navy"
              />
              <label htmlFor={`cat-${category.id}`} className="cursor-pointer hover:text-angaly-navy">
                {category.name}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Taille (FR)</h3>
        <div className="grid grid-cols-4 gap-2">
          {CATALOGUE_SIZES.map((size) => {
            const isActive = filters.size === size;
            return (
              <button
                key={size}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter('size', isActive ? undefined : size)}
                className={
                  isActive
                    ? 'border border-angaly-navy bg-angaly-navy py-2 text-xs text-white transition-all'
                    : 'border border-angaly-border py-2 text-xs text-angaly-slate transition-all hover:border-angaly-navy hover:text-angaly-navy'
                }
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Couleur</h3>
        <div className="flex flex-wrap gap-3">
          {CATALOGUE_COLOR_FILTERS.map(({ label, hex }) => {
            const isActive = filters.color === label;
            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-pressed={isActive}
                onClick={() => setFilter('color', isActive ? undefined : label)}
                className={`h-6 w-6 rounded-full transition-all ${
                  hex === '#FFFFFF' ? 'border border-angaly-border' : ''
                } ${isActive ? 'ring-1 ring-angaly-navy ring-offset-2 ring-offset-angaly-ivory' : 'hover:ring-1 hover:ring-angaly-navy hover:ring-offset-2 hover:ring-offset-angaly-ivory'}`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Matière</h3>
        <input
          type="text"
          value={filters.material ?? ''}
          onChange={(event) => setFilter('material', event.target.value || undefined)}
          placeholder="Soie, coton, laine…"
          className="w-full border-0 border-b border-angaly-border bg-transparent py-2 text-sm text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-0"
        />
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Disponibilité</h3>
        <ul className="space-y-3 text-sm text-angaly-slate">
          {CATALOGUE_STATUS_LABELS.map(({ value, label }) => (
            <li key={value} className="flex items-center space-x-3">
              <input
                id={`status-${value}`}
                type="checkbox"
                checked={filters.status === value}
                onChange={() => setFilter('status', filters.status === value ? undefined : value)}
                className="rounded-sm border-angaly-border bg-transparent text-angaly-navy focus:ring-angaly-navy"
              />
              <label htmlFor={`status-${value}`} className="cursor-pointer hover:text-angaly-navy">
                {label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>Prix (MGA)</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={filters.priceMin ?? ''}
            onChange={(event) => setFilter('priceMin', event.target.value || undefined)}
            placeholder="Min"
            aria-label="Prix minimum"
            className="w-full border-0 border-b border-angaly-border bg-transparent py-2 text-sm text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-0"
          />
          <span className="text-angaly-slate">—</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={filters.priceMax ?? ''}
            onChange={(event) => setFilter('priceMax', event.target.value || undefined)}
            placeholder="Max"
            aria-label="Prix maximum"
            className="w-full border-0 border-b border-angaly-border bg-transparent py-2 text-sm text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
