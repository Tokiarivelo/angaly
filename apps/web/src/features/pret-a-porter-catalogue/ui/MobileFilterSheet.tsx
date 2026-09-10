'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CategoryDto } from '@angaly/types';

import type { CatalogueFiltersValues } from '../schemas/catalogue-filters.schema';
import { CatalogueFilterBar } from './CatalogueFilterBar';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CatalogueFiltersValues;
  categories: CategoryDto[];
  setFilter: (key: keyof CatalogueFiltersValues, value: string | undefined) => void;
  resetFilters: () => void;
}

/**
 * Full-screen mobile panel reusing CatalogueFilterBar's content — same Radix
 * Dialog pattern as nos-creations-galerie/ui/MobileFilterSheet.tsx and
 * components/navigation/MobileDrawer.tsx.
 */
export function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  categories,
  setFilter,
  resetFilters,
}: MobileFilterSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[70] flex flex-col bg-angaly-ivory md:hidden"
        >
          <Dialog.Title className="sr-only">Filtrer le catalogue</Dialog.Title>
          <div className="flex items-center justify-between border-b border-angaly-border px-6 py-4">
            <span className="font-heading text-lg text-angaly-navy">Filtrer</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer les filtres" className="text-angaly-navy">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <CatalogueFilterBar
              filters={filters}
              categories={categories}
              setFilter={setFilter}
              resetFilters={resetFilters}
            />
          </div>

          <div className="border-t border-angaly-border p-6">
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
