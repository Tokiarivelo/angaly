'use client';

import React, { useState } from 'react';
import { HelpCircle, Check } from 'lucide-react';

interface MeasurementFieldCardProps {
  fieldKey: string;
  label: string;
  hint: string;
  /** Value in cm (the wizard always stores cm). */
  valueCm: number | undefined;
  unit: 'cm' | 'inch';
  badge?: string | undefined;
  error?: string | undefined;
  onChangeCm: (valueCm: number) => void;
}

export const MeasurementFieldCard: React.FC<MeasurementFieldCardProps> = ({
  fieldKey,
  label,
  hint,
  valueCm,
  unit,
  badge,
  error,
  onChangeCm,
}) => {
  const [showHint, setShowHint] = useState(false);
  const displayVal =
    valueCm !== undefined ? (unit === 'inch' ? (valueCm / 2.54).toFixed(1) : valueCm.toString()) : '';

  return (
    <div
      className={`bg-[#0C2650]/40 border rounded-xl p-4 flex flex-col justify-between ${
        error ? 'border-red-400/70' : 'border-[#C5B190]/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={fieldKey} className="text-white text-xs font-medium flex items-center gap-1.5">
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="text-[#C5B190] hover:text-white"
            title={hint}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </label>
        {valueCm && !error ? (
          <span className="text-xs text-[#C5B190] flex items-center gap-1 font-mono">
            <Check className="w-3 h-3 stroke-[3]" /> OK
          </span>
        ) : badge ? (
          <span className="text-[10px] uppercase tracking-wide text-[#C5B190]/80">{badge}</span>
        ) : null}
      </div>

      {showHint && (
        <p className="text-[11px] text-[#C5B190] italic mb-2 bg-[#041329] p-2 rounded border border-[#C5B190]/20">
          {hint}
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          id={fieldKey}
          type="number"
          step="0.5"
          value={displayVal}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChangeCm(unit === 'inch' ? num * 2.54 : num);
          }}
          placeholder={`Ex: ${unit === 'cm' ? '88' : '34.5'}`}
          aria-invalid={error ? true : undefined}
          className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C5B190]"
        />
        <span className="text-xs text-[#D8D3C8] font-mono shrink-0">{unit}</span>
      </div>
      {error && <p className="text-[11px] text-red-300 mt-1.5">{error}</p>}
    </div>
  );
};
