'use client';

import { X } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

interface ActiveFilterChipsProps {
  category: CategoryDto | null;
  onReset: () => void;
}

/**
 * Real Stitch prompt (stitch-prompts/03-nos-creations-galerie.md): "Active
 * filters appear as small removable chips below the bar with a
 * 'Réinitialiser les filtres' text link." Catégorie is the only real filter
 * today (gallery-filters.const.ts) — renders nothing when none is selected,
 * one chip otherwise.
 */
export function ActiveFilterChips({ category, onReset }: ActiveFilterChipsProps) {
  if (!category) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-8 pt-6 md:px-16">
      <button
        type="button"
        onClick={onReset}
        className="border-angaly-border hover:border-angaly-navy flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs tracking-wide text-angaly-navy uppercase transition-colors"
      >
        {category.name}
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="hover:text-angaly-navy text-xs text-angaly-slate underline transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
