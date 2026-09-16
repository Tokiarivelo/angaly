'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface MediaSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const MediaSearchBar: React.FC<MediaSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un fichier…"
        aria-label="Rechercher un fichier"
        className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary-deep-navy"
      />
    </div>
  );
};
