'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, X } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

import { DECORATIVE_FILTER_LABELS } from '../consts/gallery-filters.const';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDto[];
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

function DecorativeRow({ label }: { label: string }) {
  return (
    <div
      title="Filtre à venir — aucune donnée réelle ne le supporte encore"
      className="border-angaly-border/50 flex cursor-not-allowed items-center justify-between border-b py-4 text-sm tracking-wider text-angaly-navy uppercase"
    >
      <span>{label}</span>
      <ChevronDown className="h-[18px] w-[18px]" aria-hidden="true" />
    </div>
  );
}

/**
 * stitch-prompts/03-nos-creations-galerie.md "MOBILE BEHAVIOR": filters
 * collapse into a single "Filtrer" button opening a full-screen ivory panel
 * with the same options stacked vertically and a sticky "Voir les résultats"
 * button. Same Radix Dialog pattern as components/navigation/MobileDrawer.tsx.
 * Catégorie is the one real, functional row (mirrors FilterBar.tsx's desktop
 * select) — Genre/Type/Couleur/Style stay decorative, see gallery-filters.const.ts.
 */
export function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  categoryId,
  onCategoryChange,
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
            {DECORATIVE_FILTER_LABELS.slice(0, 2).map((label) => (
              <DecorativeRow key={label} label={label} />
            ))}
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
            {DECORATIVE_FILTER_LABELS.slice(2).map((label) => (
              <DecorativeRow key={label} label={label} />
            ))}
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
