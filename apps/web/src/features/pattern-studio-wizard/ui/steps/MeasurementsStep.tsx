'use client';

import React, { useState } from 'react';
import { UserCheck, HelpCircle, Check } from 'lucide-react';
import { useMeasurementProfiles } from '../../hooks/useMeasurementProfiles';

interface MeasurementsStepProps {
  selectedProfileId?: string | undefined;
  measurements?: Record<string, number> | undefined;
  onSelectProfile: (profileId: string) => void;
  onUpdateMeasurement: (key: string, value: number) => void;
}

const DEFAULT_MEASUREMENT_KEYS = [
  { key: 'TOUR_POITRINE', label: 'Tour de poitrine', hint: 'À l’endroit le plus fort de la poitrine' },
  { key: 'TOUR_TAILLE', label: 'Tour de taille', hint: 'Au creux naturel de la taille' },
  { key: 'TOUR_HANCHES', label: 'Tour de hanches', hint: 'À l’endroit le plus large du bassin' },
  { key: 'LONGUEUR_VETEMENT', label: 'Longueur souhaitée', hint: 'De la taille ou l’épaule jusqu’à l’ourlet' },
  { key: 'LARGEUR_EPAULES', label: 'Largeur des épaules', hint: 'D’une pointe d’épaule à l’autre au dos' },
  { key: 'LONGUEUR_BRAS', label: 'Longueur du bras', hint: 'De l’épaule au poignet, coude légèrement plié' },
];

export const MeasurementsStep: React.FC<MeasurementsStepProps> = ({
  selectedProfileId,
  measurements = {},
  onSelectProfile,
  onUpdateMeasurement,
}) => {
  const { data: profiles = [] } = useMeasurementProfiles();
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [activeHint, setActiveHint] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
            Vos mesures
          </h2>
          <p className="text-[#D8D3C8] text-sm font-light">
            Sélectionnez un profil enregistré ou renseignez vos mensurations pour ce modèle.
          </p>
        </div>

        {/* Unit toggle */}
        <div className="inline-flex rounded-lg bg-[#041329] p-1 border border-[#C5B190]/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setUnit('cm')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              unit === 'cm' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
            }`}
          >
            cm
          </button>
          <button
            type="button"
            onClick={() => setUnit('inch')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              unit === 'inch' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
            }`}
          >
            pouces
          </button>
        </div>
      </div>

      {/* Existing Profiles Selector */}
      {profiles.length > 0 && (
        <div className="mb-8 p-5 bg-[#0C2650]/80 rounded-xl border border-[#C5B190]/30">
          <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#C5B190]" /> Utiliser un profil de mesures existant
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const isSelected = selectedProfileId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProfile(p.id)}
                  className={`p-3.5 rounded-lg text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#041329] border-[#C5B190] ring-1 ring-[#C5B190]'
                      : 'bg-[#041329]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50'
                  }`}
                >
                  <div>
                    <p className="text-white text-sm font-medium">{p.label}</p>
                    <p className="text-[#D8D3C8]/60 text-xs">
                      {Object.keys(p.values).length} mesures ({p.unit})
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#C5B190] text-[#041329] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Measurements Fields */}
      <div className="space-y-4">
        <h3 className="text-white font-medium text-sm">
          {profiles.length > 0 ? 'Ou ajustez vos mesures manuellement :' : 'Mensurations nécessaires :'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEFAULT_MEASUREMENT_KEYS.map((field) => {
            const rawVal = measurements[field.key];
            const displayVal =
              rawVal !== undefined
                ? unit === 'inch'
                  ? (rawVal / 2.54).toFixed(1)
                  : rawVal.toString()
                : '';

            return (
              <div
                key={field.key}
                className="bg-[#0C2650]/40 border border-[#C5B190]/20 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={field.key} className="text-white text-xs font-medium flex items-center gap-1.5">
                    <span>{field.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHint(activeHint === field.key ? null : field.key)
                      }
                      className="text-[#C5B190] hover:text-white"
                      title={field.hint}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  {rawVal && (
                    <span className="text-xs text-[#C5B190] flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3 stroke-[3]" /> OK
                    </span>
                  )}
                </div>

                {activeHint === field.key && (
                  <p className="text-[11px] text-[#C5B190] italic mb-2 bg-[#041329] p-2 rounded border border-[#C5B190]/20">
                    {field.hint}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id={field.key}
                    type="number"
                    step="0.5"
                    value={displayVal}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        const inCm = unit === 'inch' ? num * 2.54 : num;
                        onUpdateMeasurement(field.key, inCm);
                      }
                    }}
                    placeholder={`Ex: ${unit === 'cm' ? '88' : '34.5'}`}
                    className="w-full bg-[#041329] border border-[#C5B190]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C5B190]"
                  />
                  <span className="text-xs text-[#D8D3C8] font-mono shrink-0">{unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs italic text-[#D8D3C8]/70 mt-6 text-center">
        Vos mesures sont des données personnelles protégées et ne sont utilisées que pour vos projets Angaly.
      </p>
    </div>
  );
};
