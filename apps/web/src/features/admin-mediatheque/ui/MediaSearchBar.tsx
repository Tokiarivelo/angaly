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
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-angaly-slate" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un fichier…"
        aria-label="Rechercher un fichier"
        className="w-full pl-9 pr-3 py-2 text-xs border border-angaly-border rounded-sm bg-white text-angaly-navy placeholder-angaly-slate/70 focus:outline-none focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold transition-colors shadow-2xs"
      />
    </div>
  );
};
