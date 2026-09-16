'use client';

import React from 'react';
import { X } from 'lucide-react';

import type { PageSectionVersionDto } from '../api/page-sections.api';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: PageSectionVersionDto[];
  isLoading: boolean;
  onRestore: (versionId: string) => void;
  isRestoring: boolean;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  versions,
  isLoading,
  onRestore,
  isRestoring,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary-deep-navy/20">
      <div className="w-full max-w-sm h-full bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-serif text-lg text-primary-deep-navy">Historique des versions</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 text-slate hover:text-primary-deep-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading && <p className="text-sm text-slate">Chargement…</p>}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-slate">Aucune version enregistrée pour cette section.</p>
          )}
          {versions.map((version) => (
            <div key={version.id} className="border border-border rounded-lg p-4">
              <p className="text-sm text-primary-deep-navy font-medium">
                {new Date(version.createdAt).toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-slate mt-1">
                Édité par {version.editedById ?? 'un utilisateur inconnu'}
              </p>
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => onRestore(version.id)}
                className="mt-3 text-xs font-medium text-primary-deep-navy underline hover:no-underline disabled:opacity-50"
              >
                Restaurer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
