'use client';

import React from 'react';
import {
  TRIM_BOUNDS,
  TRIM_LABELS,
  TRIM_MATERIALS,
  TRIM_MATERIAL_LABELS,
  TRIM_PLACE_LABELS,
  isHexColor,
  type Trim,
  type TrimSpec,
} from '@angaly/types';
import { TRIM_SLOTS, findTrim, toggleTrim, trimsAvailableFor, updateTrim, type TrimSlot } from '../../utils/trims';

interface TrimsEditorProps {
  garmentType: string;
  /** The customer's own choice (what gets saved); `undefined` = not chosen yet. */
  value: TrimSpec | undefined;
  /** What the photo suggests: shown and applied until the customer chooses otherwise. */
  suggested?: TrimSpec | undefined;
  onChange: (spec: TrimSpec | null) => void;
}

const SLOT_LABELS: Record<TrimSlot, string> = {
  BERTHE: TRIM_LABELS.BERTHE,
  SLEEVE_FRILL: TRIM_LABELS.SLEEVE_FRILL,
  'BEADING:ENCOLURE': `Perles — ${TRIM_PLACE_LABELS.ENCOLURE.toLowerCase()}`,
  'BEADING:BERTHE': `Perles — ${TRIM_PLACE_LABELS.BERTHE.toLowerCase()}`,
  'BEADING:MANCHES': `Perles — ${TRIM_PLACE_LABELS.MANCHES.toLowerCase()}`,
  'BEADING:TAILLE': `Perles — ${TRIM_PLACE_LABELS.TAILLE.toLowerCase()}`,
};

const HINTS: Record<TrimSlot, string> = {
  BERTHE: 'Bande de dentelle le long du décolleté, en V au milieu devant',
  SLEEVE_FRILL: 'Volants froncés étagés au bas des manches',
  'BEADING:ENCOLURE': 'Un rang de perles cousu sur le bord',
  'BEADING:BERTHE': 'Le long de la pointe de la berthe',
  'BEADING:MANCHES': 'Au bord des manches',
  'BEADING:TAILLE': 'Sur la couture de taille',
};

const Range: React.FC<{
  id: string;
  label: string;
  unit: string;
  bounds: { min: number; max: number; step: number };
  value: number;
  onChange: (v: number) => void;
}> = ({ id, label, unit, bounds, value, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label htmlFor={id} className="text-white text-xs">
        {label}
      </label>
      <span className="text-xs text-[#C5B190] font-mono">
        {value}
        {unit}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={bounds.min}
      max={bounds.max}
      step={bounds.step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-[#C5B190]"
    />
  </div>
);

/** Switch garnitures on/off (lace berthe, sleeve frills, bead rows) and tune them; the photo's reading is the start. */
export const TrimsEditor: React.FC<TrimsEditorProps> = ({ garmentType, value, suggested, onChange }) => {
  if (!trimsAvailableFor(garmentType)) return null;
  const fromSuggestion = value === undefined && (suggested?.items.length ?? 0) > 0;
  const effective = value ?? suggested;
  const edit = (slot: TrimSlot, patch: Record<string, number | string | null>) => onChange(updateTrim(effective, slot, patch));

  const controls = (slot: TrimSlot, trim: Trim): React.ReactNode => {
    const id = (name: string) => `trim-${slot}-${name}`;
    const material =
      trim.kind === 'BEADING' ? null : (
        <div>
          <label htmlFor={id('material')} className="block text-white text-xs mb-1">
            Matière
          </label>
          <select
            id={id('material')}
            value={trim.material}
            onChange={(e) => edit(slot, { material: e.target.value })}
            className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            {TRIM_MATERIALS.map((m) => (
              <option key={m} value={m}>
                {TRIM_MATERIAL_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      );
    const color = (
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id('color')} className="text-white text-xs">
          Couleur
        </label>
        <span className="flex items-center gap-2">
          <input
            id={id('color')}
            type="color"
            value={isHexColor(trim.color) ? trim.color : '#f2e6c9'}
            onChange={(e) => edit(slot, { color: e.target.value })}
            className="h-7 w-10 rounded border border-[#C5B190]/30 bg-transparent"
          />
          {trim.color && (
            <button type="button" onClick={() => edit(slot, { color: null })} className="text-[11px] text-[#D8D3C8] underline">
              Par défaut
            </button>
          )}
        </span>
      </div>
    );
    switch (trim.kind) {
      case 'BERTHE':
        return (
          <>
            <Range id={id('depth')} label="Hauteur de la berthe" unit=" mm" bounds={TRIM_BOUNDS.bertheDepthMm} value={trim.depthMm} onChange={(v) => edit(slot, { depthMm: v })} />
            <Range id={id('point')} label="Pointe au milieu devant" unit=" mm" bounds={TRIM_BOUNDS.berthePointMm} value={trim.pointMm} onChange={(v) => edit(slot, { pointMm: v })} />
            {material}
            {color}
          </>
        );
      case 'SLEEVE_FRILL':
        return (
          <>
            <Range id={id('tiers')} label="Nombre de volants" unit="" bounds={TRIM_BOUNDS.frillTiers} value={trim.tiers} onChange={(v) => edit(slot, { tiers: v })} />
            <Range id={id('depth')} label="Hauteur d’un volant" unit=" mm" bounds={TRIM_BOUNDS.frillDepthMm} value={trim.depthMm} onChange={(v) => edit(slot, { depthMm: v })} />
            {material}
            {color}
          </>
        );
      case 'BEADING':
        return (
          <>
            <Range id={id('bead')} label="Diamètre des perles" unit=" mm" bounds={TRIM_BOUNDS.beadMm} value={trim.beadMm} onChange={(v) => edit(slot, { beadMm: v })} />
            <Range id={id('rows')} label="Nombre de rangs" unit="" bounds={TRIM_BOUNDS.beadRows} value={trim.rows} onChange={(v) => edit(slot, { rows: v })} />
            {color}
          </>
        );
    }
  };

  return (
    <div className="mt-8 space-y-4" data-testid="trims-editor">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-medium text-sm">Garnitures</h3>
          <p className="text-[11px] text-[#D8D3C8]/70 mt-1">
            Dentelles et perles cousues sur la robe finie : elles ajoutent leurs pièces au patron et la mercerie à la
            liste.
          </p>
        </div>
        {fromSuggestion && (
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#C5B190] border border-[#C5B190]/40 rounded px-1.5 py-0.5">
            Suggéré par l’IA — modifiable
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TRIM_SLOTS.map((slot) => {
          const trim = findTrim(effective, slot);
          return (
            <div
              key={slot}
              className={`rounded-xl border p-4 space-y-3 ${trim ? 'border-[#C5B190] bg-[#041329]' : 'border-[#C5B190]/20 bg-[#0C2650]/40'}`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(trim)}
                  onChange={() => onChange(toggleTrim(effective, slot))}
                  aria-label={SLOT_LABELS[slot]}
                  className="mt-1 accent-[#C5B190]"
                />
                <span>
                  <span className="block text-white text-sm font-medium">{SLOT_LABELS[slot]}</span>
                  <span className="block text-[11px] text-[#D8D3C8]/70">{HINTS[slot]}</span>
                </span>
              </label>
              {trim && <div className="space-y-3">{controls(slot, trim)}</div>}
            </div>
          );
        })}
      </div>
      {value !== undefined && (
        <button type="button" onClick={() => onChange(null)} className="text-[11px] text-[#D8D3C8] underline hover:text-white">
          Réinitialiser
        </button>
      )}
    </div>
  );
};
