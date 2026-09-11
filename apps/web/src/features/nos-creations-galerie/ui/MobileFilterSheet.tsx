'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

import {
  COLOR_OPTIONS,
  GENRE_OPTIONS,
  STYLE_OPTIONS,
  TYPE_OPTIONS,
} from '../consts/gallery-filters.const';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  genre?: string | null | undefined;
  onGenreChange?: ((genre: string | null) => void) | undefined;
  type?: string | null | undefined;
  onTypeChange?: ((type: string | null) => void) | undefined;
  color?: string | null | undefined;
  onColorChange?: ((color: string | null) => void) | undefined;
  style?: string | null | undefined;
  onStyleChange?: ((style: string | null) => void) | undefined;
}

function MobileSelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="border-angaly-border/50 flex items-center justify-between border-b py-4">
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full cursor-pointer border-none bg-transparent text-sm tracking-wider text-angaly-navy uppercase focus:outline-none"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * stitch-prompts/03-nos-creations-galerie.md "MOBILE BEHAVIOR": filters
 * collapse into a single "Filtrer" button opening a full-screen ivory panel
 * with the options stacked vertically and a sticky "Voir les résultats"
 * button. Same Radix Dialog pattern as components/navigation/MobileDrawer.tsx.
 */
export function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  categoryId,
  onCategoryChange,
  genre,
  onGenreChange,
  type,
  onTypeChange,
  color,
  onColorChange,
  style,
  onStyleChange,
}: MobileFilterSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[70] flex flex-col bg-angaly-ivory md:hidden"
        >
          <Dialog.Title className="sr-only">Filtrer les créations</Dialog.Title>
          <div className="border-angaly-border flex items-center justify-between border-b px-6 py-4">
            <span className="font-heading text-lg text-angaly-navy">Filtrer</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer les filtres" className="text-angaly-navy">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <MobileSelectRow
              label="Genre"
              value={genre ?? null}
              options={GENRE_OPTIONS}
              onChange={(val) => onGenreChange?.(val)}
            />
            <MobileSelectRow
              label="Type"
              value={type ?? null}
              options={TYPE_OPTIONS}
              onChange={(val) => onTypeChange?.(val)}
            />
            <div className="border-angaly-border/50 flex items-center justify-between border-b py-4">
              <select
                aria-label="Catégorie"
                value={categoryId ?? ''}
                onChange={(event) => onCategoryChange(event.target.value || null)}
                className="w-full cursor-pointer border-none bg-transparent text-sm tracking-wider text-angaly-navy uppercase focus:outline-none"
              >
                <option value="">Catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <MobileSelectRow
              label="Couleur"
              value={color ?? null}
              options={COLOR_OPTIONS}
              onChange={(val) => onColorChange?.(val)}
            />
            <MobileSelectRow
              label="Style"
              value={style ?? null}
              options={STYLE_OPTIONS}
              onChange={(val) => onStyleChange?.(val)}
            />
          </div>

          <div className="border-angaly-border border-t p-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-sm bg-angaly-navy py-4 text-sm tracking-wider text-white uppercase transition-colors hover:bg-angaly-navy-blue"
              >
                Voir les résultats
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
