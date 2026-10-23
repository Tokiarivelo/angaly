'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { PatternCatalogEntryDto } from '@angaly/types';

interface CatalogPiecesDialogProps {
  entry: PatternCatalogEntryDto;
  onClose: () => void;
}

/** The pieces of a catalogue dress, as the engine cuts them at the reference measurements. */
export const CatalogPiecesDialog: React.FC<CatalogPiecesDialogProps> = ({ entry, onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="catalog-pieces-title"
    className="fixed inset-0 z-50 flex items-center justify-center bg-angaly-primary/40 p-4"
    onClick={onClose}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div className="bg-white rounded-xl border border-angaly-border border-t-2 border-t-angaly-champagne shadow-md w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 p-6 border-b border-angaly-border/50">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-angaly-gold font-semibold">{entry.era}</p>
          <h2 id="catalog-pieces-title" className="font-serif text-2xl text-[#061938]">
            {entry.title}
          </h2>
          <p className="text-xs text-[#5C697A] mt-1">
            {entry.pieceCount} pièces, taillées à vos mesures à la génération (ici aux mensurations de référence).
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="text-[#5C697A] hover:text-[#061938]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <ul className="overflow-y-auto p-6 space-y-1 text-sm">
        {entry.pieces.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-4 border-b border-angaly-border/40 py-1.5">
            <span className="text-[#061938]">{p.name}</span>
            <span className="font-mono text-xs text-[#5C697A]">×{p.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
