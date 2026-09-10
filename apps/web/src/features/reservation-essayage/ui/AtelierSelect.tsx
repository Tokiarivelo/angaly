'use client';

import { MapPin } from 'lucide-react';
import type { AtelierDto } from '@angaly/types';

interface AtelierSelectProps {
  ateliers: AtelierDto[];
  value: string;
  onChange: (atelierId: string) => void;
  isLoading: boolean;
}

/** Section 2 — "Lieu de l'essayage" dropdown + address line below (verified on the real Stitch screen). */
export function AtelierSelect({ ateliers, value, onChange, isLoading }: AtelierSelectProps) {
  const selectedAtelier = ateliers.find((atelier) => atelier.id === value) ?? null;

  return (
    <div>
      <select
        id="atelierId"
        value={value}
        disabled={isLoading}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none border-0 border-b border-angaly-border bg-transparent py-3 text-angaly-navy focus:border-angaly-gold focus:ring-0"
      >
        <option value="" disabled>
          {isLoading ? 'Chargement…' : 'Sélectionnez un atelier'}
        </option>
        {ateliers.map((atelier) => (
          <option key={atelier.id} value={atelier.id}>
            {atelier.name}
          </option>
        ))}
      </select>
      {selectedAtelier && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-angaly-slate">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          {selectedAtelier.address}, {selectedAtelier.city}
        </p>
      )}
    </div>
  );
}
