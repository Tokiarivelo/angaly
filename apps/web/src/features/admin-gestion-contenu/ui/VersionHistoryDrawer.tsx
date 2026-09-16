'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { PageSectionVersionDto } from '../api/page-sections.api';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: PageSectionVersionDto[];
  isLoading: boolean;
  onRestore: (versionId: string) => void;
  isRestoring: boolean;
}

/**
 * Built on `@radix-ui/react-dialog` (same primitive as the public site's
 * MobileDrawer/MobileSearchOverlay) — gets focus-trap, Escape-to-close, and
 * focus-restore-to-trigger for free, unlike the previous hand-rolled
 * `fixed inset-0` div with no keyboard handling.
 */
export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  isLoading,
  onRestore,
  isRestoring,
}) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-angaly-navy/20" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden bg-white shadow-xl"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <DialogPrimitive.Title className="font-serif text-lg text-angaly-navy">
              Historique des versions
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button aria-label="Fermer" className="p-1 text-angaly-slate hover:text-angaly-navy">
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {isLoading &&
              Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {!isLoading && versions.length === 0 && (
              <p className="text-sm text-angaly-slate">Aucune version enregistrée pour cette section.</p>
            )}
            {versions.map((version) => (
              <div key={version.id} className="border border-border rounded-lg p-4">
                <p className="text-sm text-angaly-navy font-medium">
                  {new Date(version.createdAt).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-angaly-slate mt-1">
                  Édité par {version.editedById ?? 'un utilisateur inconnu'}
                </p>
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => onRestore(version.id)}
                  className="mt-3 text-xs font-medium text-angaly-navy underline hover:no-underline disabled:opacity-50"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
