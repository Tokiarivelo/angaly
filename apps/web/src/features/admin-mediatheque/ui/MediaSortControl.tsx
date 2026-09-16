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
      <label className="text-xs text-angaly-slate" htmlFor="media-sort">
        Trier par
      </label>
      <select
        id="media-sort"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'recent' | 'name' | 'size')}
        className="text-sm border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-angaly-navy"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          aria-label="Vue grille"
          aria-pressed={view === 'grid'}
          onClick={() => onViewChange('grid')}
          className={`p-1.5 ${view === 'grid' ? 'bg-angaly-navy text-white' : 'text-angaly-slate'}`}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          aria-label="Vue liste"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
          className={`p-1.5 ${view === 'list' ? 'bg-angaly-navy text-white' : 'text-angaly-slate'}`}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
};
