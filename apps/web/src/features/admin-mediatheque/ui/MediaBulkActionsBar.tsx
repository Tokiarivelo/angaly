'use client';

import React from 'react';

interface MediaBulkActionsBarProps {
  count: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const MediaBulkActionsBar: React.FC<MediaBulkActionsBarProps> = ({ count, onDownload, onDelete, onClear }) => {
  if (count === 0) return null;

  return (
    <div className="h-14 bg-angaly-navy text-white px-6 flex items-center justify-between shadow-sm z-20 shrink-0 rounded-sm">
      <div className="flex items-center gap-4">
        <span className="font-body text-xs sm:text-sm font-medium">
          {count} fichier{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-angaly-slate hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="text-xs font-semibold uppercase tracking-wider px-4 py-1.5 border border-[#18375D] hover:border-white/50 rounded-sm transition-colors text-white cursor-pointer"
        >
          Télécharger
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs font-semibold uppercase tracking-wider px-4 py-1.5 bg-red-900/60 text-red-100 hover:bg-red-800 rounded-sm transition-colors cursor-pointer"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};
