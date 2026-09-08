'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, X } from 'lucide-react';

import { DECORATIVE_FILTER_LABELS } from '../consts/gallery-filters.const';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * stitch-prompts/03-nos-creations-galerie.md "MOBILE BEHAVIOR": filters
 * collapse into a single "Filtrer" button opening a full-screen ivory panel
 * with the same options stacked vertically and a sticky "Voir les résultats"
 * button. Same Radix Dialog pattern as components/navigation/MobileDrawer.tsx.
 * Same decorative-only limitation as the desktop bar (gallery-filters.const.ts)
 * — "Voir les résultats" just closes the sheet, it doesn't apply a filter.
 */
export function MobileFilterSheet({ isOpen, onClose }: MobileFilterSheetProps) {
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
            {DECORATIVE_FILTER_LABELS.map((label) => (
              <div
                key={label}
                title="Filtre à venir — aucune donnée réelle ne le supporte encore"
                className="border-angaly-border/50 flex cursor-not-allowed items-center justify-between border-b py-4 text-sm tracking-wider text-angaly-navy uppercase"
              >
                <span>{label}</span>
                <ChevronDown className="h-[18px] w-[18px]" aria-hidden="true" />
              </div>
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
