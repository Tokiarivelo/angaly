'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

const SORT_OPTIONS: Array<{ id: 'recent' | 'name' | 'size'; label: string }> = [
  { id: 'recent', label: 'Récents' },
  { id: 'name', label: 'Nom' },
  { id: 'size', label: 'Taille' },
];

interface MediaSortControlProps {
  sortBy: 'recent' | 'name' | 'size';
  onSortChange: (sortBy: 'recent' | 'name' | 'size') => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export const MediaSortControl: React.FC<MediaSortControlProps> = ({ sortBy, onSortChange, view, onViewChange }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-angaly-slate font-medium whitespace-nowrap" htmlFor="media-sort">
          Trier par
        </label>
        <select
          id="media-sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'recent' | 'name' | 'size')}
          className="text-xs border border-angaly-border rounded-sm px-2.5 py-1.5 bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold shadow-2xs cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 bg-angaly-warm-ivory/50 p-1 rounded-sm border border-angaly-border">
        <button
          type="button"
          aria-label="Vue grille"
          aria-pressed={view === 'grid'}
          onClick={() => onViewChange('grid')}
          className={`p-1.5 rounded-[2px] transition-colors ${
            view === 'grid'
              ? 'bg-white text-angaly-navy shadow-xs'
              : 'text-angaly-slate hover:text-angaly-navy'
          }`}
        >
          <LayoutGrid size={15} />
        </button>
        <button
          type="button"
          aria-label="Vue liste"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
          className={`p-1.5 rounded-[2px] transition-colors ${
            view === 'list'
              ? 'bg-white text-angaly-navy shadow-xs'
              : 'text-angaly-slate hover:text-angaly-navy'
          }`}
        >
          <List size={15} />
        </button>
      </div>
    </div>
  );
};
