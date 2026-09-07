'use client';

import { CONTENT_TYPE_FILTERS } from '../consts/content-type-filters.const';
import type { FilterPillValue } from '../types/la-une-item.types';

/** Real Stitch "La Une" screen: horizontal scroll on mobile, active pill underlined champagne. */
export function ContentTypeFilterBar({
  activeFilter,
  onChange,
}: {
  activeFilter: FilterPillValue | 'all';
  onChange: (value: FilterPillValue | 'all') => void;
}) {
  return (
    <section className="border-angaly-border flex w-full overflow-x-auto border-b px-8 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center space-x-8">
        {CONTENT_TYPE_FILTERS.map((filter) => {
          const isActive = filter.value === activeFilter;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(filter.value)}
              className={`pb-1 text-sm font-medium tracking-wide transition-colors ${
                isActive
                  ? 'border-angaly-champagne text-angaly-navy border-b-2'
                  : 'text-angaly-slate hover:text-angaly-navy'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
