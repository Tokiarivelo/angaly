'use client';

import { JOURNAL_CATEGORY_FILTERS, type JournalCategorySlug } from '../consts/journal-categories.const';

/** Real screen's 7-pill filter row (spec §43) — "Tout" is a front-only state, not a Category row. */
export function CategoryFilterPills({
  active,
  onChange,
}: {
  active: JournalCategorySlug;
  onChange: (slug: JournalCategorySlug) => void;
}) {
  return (
    <div className="mb-20 flex flex-wrap justify-center gap-4 border-b border-angaly-border pb-4 md:gap-8">
      {JOURNAL_CATEGORY_FILTERS.map((filter) => {
        const isActive = filter.slug === active;
        return (
          <button
            key={filter.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter.slug)}
            className={`pb-2 text-sm font-medium tracking-wider uppercase transition-colors ${
              isActive
                ? 'border-b-2 border-angaly-champagne text-angaly-navy'
                : 'text-angaly-slate hover:text-angaly-navy'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
