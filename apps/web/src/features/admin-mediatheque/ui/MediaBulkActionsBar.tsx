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
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-primary-deep-navy text-white rounded-lg text-sm">
      <span>{count} fichier{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-4">
        <button type="button" onClick={onDownload} className="hover:underline">
          Télécharger
        </button>
        <button type="button" onClick={onDelete} className="hover:underline">
          Supprimer
        </button>
        <button type="button" onClick={onClear} className="text-white/70 hover:text-white">
          Annuler
        </button>
      </div>
    </div>
  );
};
