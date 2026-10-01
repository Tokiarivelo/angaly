'use client';

import React from 'react';
import { SearchX } from 'lucide-react';

interface MediaNoResultsStateProps {
  onResetFilters: () => void;
}

/**
 * Shown when an active search/folder filter matches nothing — distinct from
 * `MediaEmptyState` (a genuinely empty library), which previously rendered
 * here too with confusing "Glissez vos fichiers ici" copy for what was
 * really just a filter with zero matches.
 */
export const MediaNoResultsState: React.FC<MediaNoResultsStateProps> = ({ onResetFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-angaly-border rounded-sm bg-white shadow-2xs">
      <div className="w-14 h-14 rounded-full bg-angaly-ivory flex items-center justify-center mb-4 text-angaly-slate">
        <SearchX size={26} />
      </div>
      <p className="text-angaly-navy font-heading text-lg mb-1">Aucun média ne correspond à ces filtres</p>
      <p className="text-xs text-angaly-slate mb-6">Essayez un autre terme de recherche ou un autre dossier.</p>
      <button
        type="button"
        onClick={onResetFilters}
        className="text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-angaly-navy text-angaly-navy hover:bg-angaly-ivory rounded-sm transition-colors cursor-pointer"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
};
