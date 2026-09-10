'use client';

import { MapPin } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

interface AtelierSelectProps {
  ateliers: AtelierDto[];
  value: string;
  onChange: (atelierId: string) => void;
  isLoading: boolean;
}

/** Section 2 — "2. Atelier" dropdown (location icon, verified on the real Stitch screen). */
export function AtelierSelect({ ateliers, value, onChange, isLoading }: AtelierSelectProps) {
  return (
    <div>
      <label htmlFor="atelierId" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
        2. Atelier
      </label>
      <div className="relative">
        <MapPin
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 text-angaly-slate"
        />
        <select
          id="atelierId"
          value={value}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none border-0 border-b border-angaly-border bg-transparent py-3 pl-8 text-angaly-navy focus:border-angaly-gold focus:ring-0"
        >
          <option value="" disabled>
            {isLoading ? 'Chargement…' : 'Sélectionnez un atelier'}
          </option>
          {ateliers.map((atelier) => (
            <option key={atelier.id} value={atelier.id}>
              {atelier.name} — {atelier.city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
