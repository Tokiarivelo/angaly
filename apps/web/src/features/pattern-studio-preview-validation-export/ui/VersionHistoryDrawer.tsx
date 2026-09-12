'use client';

import React from 'react';
import { X, History, RotateCcw, Loader2 } from 'lucide-react';
import { useVersionHistory } from '../hooks/useVersionHistory';

interface VersionHistoryDrawerProps {
  projectId: string;
  currentVersionId?: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  projectId,
  currentVersionId,
  isOpen,
  onClose,
}) => {
  const { data: versions = [], isRestoring, restoreVersion } = useVersionHistory(projectId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#041329] border-l border-[#C5B190]/30 p-6 flex flex-col justify-between shadow-2xl z-10 text-white">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#C5B190]/20 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#C5B190]" />
              <h2 className="font-serif text-xl font-light">
                Historique des versions
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#0C2650] text-[#D8D3C8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#D8D3C8]/70 font-light mb-6">
            Chaque modification géométrique et chaque validation par l’atelier crée un point de sauvegarde auditable.
          </p>

          {/* Version List */}
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {versions.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#0C2650] text-center text-xs text-[#D8D3C8]">
                Aucune version archivée pour le moment.
              </div>
            ) : (
              versions.map((ver) => {
                const isCurrent = ver.id === currentVersionId;

                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#0C2650] border-l-4 border-l-[#C5B190] border-t border-r border-b border-t-[#C5B190]/30 border-r-[#C5B190]/30 border-b-[#C5B190]/30'
                        : 'bg-[#0C2650]/50 border-[#C5B190]/15 hover:border-[#C5B190]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium text-sm text-white">
                          Version {ver.versionNumber}.0
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-[#C5B190] text-[#041329] px-2 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#D8D3C8]/60 font-mono">
                        {new Date(ver.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-xs text-[#D8D3C8] font-light mb-3">
                      {ver.changeLabel ?? 'Génération géométrique initiale'}
                    </p>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => restoreVersion(ver.id)}
                        disabled={isRestoring}
                        className="inline-flex items-center gap-1.5 text-xs text-[#C5B190] hover:text-white transition-colors"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Restaurer cette version</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#C5B190]/15 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-[#C5B190]/30 text-xs uppercase tracking-wider text-[#D8D3C8] hover:text-white hover:bg-[#0C2650] transition-colors"
          >
            Fermer le panneau
          </button>
        </div>
      </div>
    </div>
  );
};
