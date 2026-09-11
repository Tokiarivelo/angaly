'use client';

import { X } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

interface ActiveFilterChipsProps {
  category?: CategoryDto | null | undefined;
  genre?: string | null | undefined;
  type?: string | null | undefined;
  color?: string | null | undefined;
  style?: string | null | undefined;
  onRemoveCategory?: (() => void) | undefined;
  onRemoveGenre?: (() => void) | undefined;
  onRemoveType?: (() => void) | undefined;
  onRemoveColor?: (() => void) | undefined;
  onRemoveStyle?: (() => void) | undefined;
  onReset: () => void;
}

/**
 * Real Stitch prompt (stitch-prompts/03-nos-creations-galerie.md): "Active
 * filters appear as small removable chips below the bar with a
 * 'Réinitialiser les filtres' text link."
 */
export function ActiveFilterChips({
  category,
  genre,
  type,
  color,
  style,
  onRemoveCategory,
  onRemoveGenre,
  onRemoveType,
  onRemoveColor,
  onRemoveStyle,
  onReset,
}: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; onRemove?: (() => void) | undefined }[] = [];

  if (category) {
    chips.push({ key: 'category', label: category.name, onRemove: onRemoveCategory ?? onReset });
  }
  if (genre) {
    chips.push({ key: 'genre', label: `Genre: ${genre}`, onRemove: onRemoveGenre });
  }
  if (type) {
    chips.push({ key: 'type', label: `Type: ${type}`, onRemove: onRemoveType });
  }
  if (color) {
    chips.push({ key: 'color', label: `Couleur: ${color}`, onRemove: onRemoveColor });
  }
  if (style) {
    chips.push({ key: 'style', label: `Style: ${style}`, onRemove: onRemoveStyle });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-8 pt-6 md:px-16">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove ?? onReset}
          className="border-angaly-border hover:border-angaly-navy flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs tracking-wide text-angaly-navy uppercase transition-colors"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
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
