'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { NOTES_BOUNDS, type PatternNotes } from '@angaly/types';

interface CustomMeasurementsProps {
  notes: PatternNotes | undefined;
  onChange: (notes: PatternNotes | null) => void;
}

type Row = { label: string; cm: string };

/**
 * Measurements of the customer's own, not in the catalogue (a calf, a heel height…): saved with the pattern for the
 * atelier — the engine does not draw them. Rows being typed stay here until they have a name and a value.
 */
export const CustomMeasurements: React.FC<CustomMeasurementsProps> = ({ notes, onChange }) => {
  const [rows, setRows] = useState<Row[]>(() => (notes?.measurements ?? []).map((m) => ({ label: m.label, cm: String(m.cm) })));

  const save = (next: Row[]) => {
    setRows(next);
    const complete = next
      .map((r) => ({ label: r.label.trim(), cm: Number(r.cm.replace(',', '.')) }))
      .filter((r) => r.label && Number.isFinite(r.cm) && r.cm >= NOTES_BOUNDS.cm[0] && r.cm <= NOTES_BOUNDS.cm[1]);
    const rest: PatternNotes = {
      ...(notes?.details ? { details: notes.details } : {}),
      ...(notes?.general ? { general: notes.general } : {}),
      ...(complete.length > 0 ? { measurements: complete } : {}),
    };
    onChange(Object.keys(rest).length > 0 ? rest : null);
  };

  return (
    <section className="mt-8" aria-labelledby="custom-measurements-title">
      <h3 id="custom-measurements-title" className="text-white font-medium text-sm">
        Mesures supplémentaires
      </h3>
      <p className="text-[11px] text-[#D8D3C8]/70 mt-1 mb-3">
        Une mesure qui n’est pas dans la liste (tour de mollet, hauteur de talon…) ? Ajoutez-la : elle est jointe au patron
        pour l’atelier.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              aria-label={`Nom de la mesure ${i + 1}`}
              type="text"
              maxLength={NOTES_BOUNDS.labelChars}
              value={row.label}
              placeholder="Nom (ex. tour de mollet)"
              onChange={(e) => save(rows.map((r, k) => (k === i ? { ...r, label: e.target.value } : r)))}
              className="flex-1 rounded-md border border-[#C5B190]/30 bg-[#041329] px-3 py-2 text-sm text-white placeholder:text-[#D8D3C8]/40 focus:border-[#C5B190] focus:outline-none"
            />
            <input
              aria-label={`Valeur de la mesure ${i + 1} (cm)`}
              type="number"
              inputMode="decimal"
              min={NOTES_BOUNDS.cm[0]}
              max={NOTES_BOUNDS.cm[1]}
              step="0.5"
              value={row.cm}
              placeholder="cm"
              onChange={(e) => save(rows.map((r, k) => (k === i ? { ...r, cm: e.target.value } : r)))}
              className="w-24 rounded-md border border-[#C5B190]/30 bg-[#041329] px-3 py-2 text-sm text-white placeholder:text-[#D8D3C8]/40 focus:border-[#C5B190] focus:outline-none"
            />
            <button
              type="button"
              aria-label={`Retirer la mesure ${i + 1}`}
              onClick={() => save(rows.filter((_, k) => k !== i))}
              className="p-2 text-[#D8D3C8] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {rows.length < NOTES_BOUNDS.measurements && (
        <button
          type="button"
          onClick={() => setRows([...rows, { label: '', cm: '' }])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[#C5B190]/40 px-3 py-2 text-xs text-[#D8D3C8] hover:border-[#C5B190] hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Ajouter une mesure
        </button>
      )}
    </section>
  );
};
