'use client';

import React from 'react';
import {
  EASE_LEVELS,
  EASE_LEVEL_LABELS,
  FULLNESS_BOUNDS,
  LENGTH_BOUNDS,
  type PatternExtKey,
  type PatternExtParameters,
} from '@angaly/types';
import { effectiveFit, fitControlsFor, type FitChange } from '../../utils/fit-parameters';

interface FitAdjustmentsProps {
  garmentType: string;
  /** The customer's own choices (what gets saved). */
  value: PatternExtParameters | undefined;
  /** What the photo analysis suggests: shown and applied until the customer chooses otherwise. */
  suggested?: PatternExtParameters | undefined;
  onChange: (change: FitChange) => void;
}

const EASE_HINTS: Record<(typeof EASE_LEVELS)[number], string> = {
  AJUSTE: 'Près du corps',
  CONFORT: 'Aisance standard',
  AMPLE: 'Ample, confortable',
};

interface SliderProps {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number | undefined;
  defaultLabel: string;
  /** Value comes from the photo analysis and was not changed by the customer. */
  suggested?: boolean;
  /** The customer set (or overrode) this value: it can be reset. */
  overridden?: boolean;
  onChange: (value: number | null) => void;
}

const SuggestedTag: React.FC = () => (
  <span className="text-[10px] uppercase tracking-wide text-[#C5B190] border border-[#C5B190]/40 rounded px-1.5 py-0.5">
    Suggéré par l’IA — modifiable
  </span>
);

const Slider: React.FC<SliderProps> = ({
  id,
  label,
  unit,
  min,
  max,
  step,
  value,
  defaultLabel,
  suggested = false,
  overridden = false,
  onChange,
}) => (
  <div className="bg-[#0C2650]/40 border border-[#C5B190]/20 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <label htmlFor={id} className="text-white text-xs font-medium">
        {label}
      </label>
      <span className="text-xs text-[#C5B190] font-mono">
        {value !== undefined ? `${value}${unit}` : defaultLabel}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? min}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-[#C5B190]"
    />
    <div className="mt-2 flex items-center justify-between gap-2">
      {suggested ? <SuggestedTag /> : <span />}
      {overridden && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] text-[#D8D3C8] underline hover:text-white"
        >
          Réinitialiser
        </button>
      )}
    </div>
  </div>
);

/** Ease, fullness and length adjustments that tune how the pattern sits on the body. */
export const FitAdjustments: React.FC<FitAdjustmentsProps> = ({ garmentType, value, suggested, onChange }) => {
  const controls = fitControlsFor(garmentType);
  const effective = effectiveFit(value, suggested);
  const shown = effective.value;
  const fromSuggestion = new Set<PatternExtKey>(effective.fromSuggestion);
  const slider = (key: PatternExtKey, own: number | undefined) => ({
    suggested: fromSuggestion.has(key),
    overridden: own !== undefined,
  });

  return (
    <div className="mt-8 space-y-4" data-testid="fit-adjustments">
      <div>
        <h3 className="text-white font-medium text-sm">Aisance et proportions</h3>
        <p className="text-[11px] text-[#D8D3C8]/70 mt-1">
          Ces réglages ajustent la coupe à votre corps. Sans choix, l’aisance standard est appliquée.
        </p>
      </div>

      <div role="radiogroup" aria-label="Aisance" className="grid grid-cols-3 gap-2.5">
        {EASE_LEVELS.map((level) => {
          const selected = (shown.ease ?? 'CONFORT') === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ field: 'ease', value: level })}
              className={`p-3 rounded-lg text-center border transition-all ${
                selected
                  ? 'bg-[#041329] border-[#C5B190] ring-1 ring-[#C5B190]'
                  : 'bg-[#041329]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50'
              }`}
            >
              <p className="text-white text-sm font-semibold">{EASE_LEVEL_LABELS[level]}</p>
              <p className="text-[#D8D3C8]/60 text-[10px]">{EASE_HINTS[level]}</p>
            </button>
          );
        })}
      </div>

      {(fromSuggestion.has('ease') || value?.ease) && (
        <div className="flex items-center justify-between gap-2">
          {fromSuggestion.has('ease') ? <SuggestedTag /> : <span />}
          {value?.ease && (
            <button
              type="button"
              onClick={() => onChange({ field: 'ease', value: null })}
              className="text-[11px] text-[#D8D3C8] underline hover:text-white"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {controls.skirt && (
          <>
            <Slider
              id="fit-skirt-pct"
              label="Longueur de jupe"
              unit=" %"
              {...LENGTH_BOUNDS.skirtPct}
              value={shown.lengths?.skirtPct}
              {...slider('lengths.skirtPct', value?.lengths?.skirtPct)}
              defaultLabel="Selon la coupe"
              onChange={(v) => onChange({ field: 'lengths.skirtPct', value: v })}
            />
            <Slider
              id="fit-skirt-fullness"
              label="Ampleur de jupe"
              unit="×"
              {...FULLNESS_BOUNDS.skirt}
              value={shown.fullness?.skirt}
              {...slider('fullness.skirt', value?.fullness?.skirt)}
              defaultLabel="Selon la coupe"
              onChange={(v) => onChange({ field: 'fullness.skirt', value: v })}
            />
          </>
        )}
        {controls.sleeve && (
          <>
            <Slider
              id="fit-sleeve-pct"
              label="Longueur de manche"
              unit=" %"
              {...LENGTH_BOUNDS.sleevePct}
              value={shown.lengths?.sleevePct}
              {...slider('lengths.sleevePct', value?.lengths?.sleevePct)}
              defaultLabel="Selon le détail choisi"
              onChange={(v) => onChange({ field: 'lengths.sleevePct', value: v })}
            />
            <Slider
              id="fit-sleeve-fullness"
              label="Ampleur de manche"
              unit="×"
              {...FULLNESS_BOUNDS.sleeve}
              value={shown.fullness?.sleeve}
              {...slider('fullness.sleeve', value?.fullness?.sleeve)}
              defaultLabel="Selon le détail choisi"
              onChange={(v) => onChange({ field: 'fullness.sleeve', value: v })}
            />
          </>
        )}
        {controls.bodice && (
          <Slider
            id="fit-bodice-pct"
            label="Longueur du buste"
            unit=" %"
            {...LENGTH_BOUNDS.bodicePct}
            value={shown.lengths?.bodicePct}
              {...slider('lengths.bodicePct', value?.lengths?.bodicePct)}
            defaultLabel="Selon vos mesures"
            onChange={(v) => onChange({ field: 'lengths.bodicePct', value: v })}
          />
        )}
      </div>
    </div>
  );
};
