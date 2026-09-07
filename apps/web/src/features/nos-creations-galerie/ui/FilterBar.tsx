'use client';

import { ChevronDown, LayoutGrid, List } from 'lucide-react';

import { DECORATIVE_FILTER_LABELS, SORT_OPTIONS } from '../consts/gallery-filters.const';
import type { GallerySort, GalleryView } from '../types/gallery.types';

/** Real Stitch screen's sticky filter bar. Only sort + view are wired — see gallery-filters.const.ts. */
export function FilterBar({
  sort,
  onSortChange,
  view,
  onViewChange,
}: {
  sort: GallerySort;
  onSortChange: (sort: GallerySort) => void;
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
}) {
  return (
    <div className="border-angaly-border sticky top-16 z-40 flex w-full flex-wrap items-center justify-between gap-4 border-y bg-angaly-ivory/95 px-8 py-4 backdrop-blur-md md:px-16">
      <div className="flex flex-wrap items-center gap-6">
        {DECORATIVE_FILTER_LABELS.map((label) => (
          <div
            key={label}
            className="hover:text-angaly-champagne flex cursor-not-allowed items-center gap-1 text-sm tracking-wider text-angaly-navy uppercase transition-colors"
            title="Filtre à venir — aucune donnée réelle ne le supporte encore"
          >
            <span>{label}</span>
            <ChevronDown className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
        ))}
      </div>

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
    </div>
  );
}
