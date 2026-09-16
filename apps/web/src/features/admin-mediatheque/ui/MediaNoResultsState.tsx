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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-border rounded-xl bg-white">
      <SearchX className="text-angaly-slate mb-4" size={40} />
      <p className="text-angaly-navy font-medium mb-1">Aucun média ne correspond à ces filtres</p>
      <p className="text-xs text-angaly-slate mb-6">Essayez un autre terme de recherche ou un autre dossier.</p>
      <button
        type="button"
        onClick={onResetFilters}
        className="text-sm font-medium text-angaly-navy underline hover:no-underline"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
};
