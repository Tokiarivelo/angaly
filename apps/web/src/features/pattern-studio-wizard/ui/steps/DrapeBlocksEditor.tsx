'use client';

import React from 'react';
import {
  DRAPE_BLOCK_LABELS,
  DRAPE_BOUNDS,
  CIRCLE_FRACTIONS,
  drapeBlockKindsFor,
  type DrapeBlock,
  type DrapeBlockKind,
  type DrapeSpec,
} from '@angaly/types';
import { findDrapeBlock, toggleDrapeBlock, updateDrapeBlock } from '../../utils/drape-blocks';

interface DrapeBlocksEditorProps {
  garmentType: string;
  /** The customer's own choice (what gets saved); `undefined` = not chosen yet. */
  value: DrapeSpec | undefined;
  /** What the photo suggests: shown and applied until the customer chooses otherwise. */
  suggested?: DrapeSpec | undefined;
  onChange: (spec: DrapeSpec | null) => void;
}

const HINTS: Record<DrapeBlockKind, string> = {
  GATHERED_SKIRT: 'Fronces régulières à la taille',
  PLEATED_SKIRT: 'Plis plats ou creux réguliers',
  CIRCLE_SKIRT: 'Tombé en ondulations circulaires',
  WRAP_FRONT: 'Un pan croise sur l’autre',
  COWL_NECK: 'Encolure qui retombe en plis',
  TRAIN: 'Traîne derrière la jupe',
  OVERSKIRT: 'Couche asymétrique sur la jupe',
  DRAPED_BODICE: 'Plis drapés sur le buste',
  ASYMMETRIC_HEM: 'Ourlet plus long d’un côté',
};

const SIDE_LABELS = { LEFT: 'Gauche', RIGHT: 'Droite' } as const;

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({ id, label, unit, min, max, step, value, onChange }) => (
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
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-[#C5B190]"
    />
  </div>
);

const SideField: React.FC<{ id: string; label: string; value: 'LEFT' | 'RIGHT'; onChange: (v: 'LEFT' | 'RIGHT') => void }> = ({
  id,
  label,
  value,
  onChange,
}) => (
  <div>
    <label htmlFor={id} className="block text-white text-xs mb-1">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as 'LEFT' | 'RIGHT')}
      className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm"
    >
      {(['LEFT', 'RIGHT'] as const).map((side) => (
        <option key={side} value={side}>
          {SIDE_LABELS[side]}
        </option>
      ))}
    </select>
  </div>
);

/** Switch deterministic drape blocks on/off and tune them; the photo's suggestion is the starting point. */
export const DrapeBlocksEditor: React.FC<DrapeBlocksEditorProps> = ({ garmentType, value, suggested, onChange }) => {
  const kinds = drapeBlockKindsFor(garmentType);
  if (kinds.length === 0) return null;

  const fromSuggestion = value === undefined && (suggested?.blocks.length ?? 0) > 0;
  const effective = value ?? suggested;
  const edit = (kind: DrapeBlockKind, patch: Record<string, number | string>) =>
    onChange(updateDrapeBlock(effective, kind, patch));

  const controls = (block: DrapeBlock): React.ReactNode => {
    const id = (name: string) => `drape-${block.kind}-${name}`;
    switch (block.kind) {
      case 'GATHERED_SKIRT':
        return (
          <NumberField id={id('fullness')} label="Ampleur" unit="×" {...DRAPE_BOUNDS.gatheredFullness} value={block.fullness} onChange={(v) => edit(block.kind, { fullness: v })} />
        );
      case 'PLEATED_SKIRT':
        return (
          <>
            <NumberField id={id('pleats')} label="Nombre de plis" unit="" {...DRAPE_BOUNDS.pleats} value={block.pleats} onChange={(v) => edit(block.kind, { pleats: v })} />
            <NumberField id={id('depth')} label="Profondeur d’un pli" unit=" mm" {...DRAPE_BOUNDS.pleatDepthMm} value={block.depthMm} onChange={(v) => edit(block.kind, { depthMm: v })} />
            <div>
              <label htmlFor={id('type')} className="block text-white text-xs mb-1">
                Type de pli
              </label>
              <select
                id={id('type')}
                value={block.type}
                onChange={(e) => edit(block.kind, { type: e.target.value })}
                className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="KNIFE">Plis plats</option>
                <option value="BOX">Plis creux</option>
              </select>
            </div>
          </>
        );
      case 'CIRCLE_SKIRT':
        return (
          <div role="radiogroup" aria-label="Fraction de cercle" className="flex gap-2">
            {CIRCLE_FRACTIONS.map((fraction) => (
              <button
                key={fraction}
                type="button"
                role="radio"
                aria-checked={block.fraction === fraction}
                onClick={() => edit(block.kind, { fraction })}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs ${
                  block.fraction === fraction
                    ? 'bg-[#041329] border-[#C5B190] text-white'
                    : 'border-[#C5B190]/20 text-[#D8D3C8] hover:border-[#C5B190]/50'
                }`}
              >
                {fraction === 1 ? 'Cercle complet' : fraction === 0.5 ? 'Demi-cercle' : 'Quart de cercle'}
              </button>
            ))}
          </div>
        );
      case 'WRAP_FRONT':
        return (
          <>
            <NumberField id={id('overlap')} label="Croisement" unit=" mm" {...DRAPE_BOUNDS.wrapOverlapMm} value={block.overlapMm} onChange={(v) => edit(block.kind, { overlapMm: v })} />
            <SideField id={id('side')} label="Pan du dessus" value={block.side} onChange={(side) => edit(block.kind, { side })} />
          </>
        );
      case 'COWL_NECK':
        return (
          <NumberField id={id('depth')} label="Profondeur du drapé" unit=" mm" {...DRAPE_BOUNDS.cowlDepthMm} value={block.depthMm} onChange={(v) => edit(block.kind, { depthMm: v })} />
        );
      case 'TRAIN':
        return (
          <NumberField id={id('length')} label="Longueur de traîne" unit=" mm" {...DRAPE_BOUNDS.trainLengthMm} value={block.lengthMm} onChange={(v) => edit(block.kind, { lengthMm: v })} />
        );
      case 'OVERSKIRT':
        return (
          <>
            <NumberField id={id('length')} label="Longueur (% de la jupe)" unit=" %" {...DRAPE_BOUNDS.overskirtLengthPct} value={block.lengthPct} onChange={(v) => edit(block.kind, { lengthPct: v })} />
            <SideField id={id('side')} label="Côté le plus long" value={block.side} onChange={(side) => edit(block.kind, { side })} />
          </>
        );
      case 'DRAPED_BODICE':
        return (
          <>
            <NumberField id={id('pleats')} label="Nombre de plis" unit="" {...DRAPE_BOUNDS.bodicePleats} value={block.pleats} onChange={(v) => edit(block.kind, { pleats: v })} />
            <SideField id={id('side')} label="Côté des plis" value={block.side} onChange={(side) => edit(block.kind, { side })} />
          </>
        );
      case 'ASYMMETRIC_HEM':
        return (
          <>
            <NumberField id={id('drop')} label="Différence de longueur" unit=" mm" {...DRAPE_BOUNDS.hemDropMm} value={block.dropMm} onChange={(v) => edit(block.kind, { dropMm: v })} />
            <SideField id={id('side')} label="Côté le plus long" value={block.side} onChange={(side) => edit(block.kind, { side })} />
          </>
        );
    }
  };

  return (
    <div className="mt-8 space-y-4" data-testid="drape-blocks-editor">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-medium text-sm">Drapé et volumes</h3>
          <p className="text-[11px] text-[#D8D3C8]/70 mt-1">
            Plis, fronces et volumes réguliers tracés à plat par le moteur. Un drapé libre (sari, lamba) se
            moule sur mannequin : une fiche vous sera remise.
          </p>
        </div>
        {fromSuggestion && (
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#C5B190] border border-[#C5B190]/40 rounded px-1.5 py-0.5">
            Suggéré par l’IA — modifiable
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kinds.map((kind) => {
          const block = findDrapeBlock(effective, kind);
          return (
            <div
              key={kind}
              className={`rounded-xl border p-4 space-y-3 ${
                block ? 'border-[#C5B190] bg-[#041329]' : 'border-[#C5B190]/20 bg-[#0C2650]/40'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(block)}
                  onChange={() => onChange(toggleDrapeBlock(effective, kind))}
                  aria-label={DRAPE_BLOCK_LABELS[kind]}
                  className="mt-1 accent-[#C5B190]"
                />
                <span>
                  <span className="block text-white text-sm font-medium">{DRAPE_BLOCK_LABELS[kind]}</span>
                  <span className="block text-[11px] text-[#D8D3C8]/70">{HINTS[kind]}</span>
                </span>
              </label>
              {block && <div className="space-y-3">{controls(block)}</div>}
            </div>
          );
        })}
      </div>

      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] text-[#D8D3C8] underline hover:text-white"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
};
