'use client';

import React, { useState } from 'react';
import { UserCheck, Check, Ruler } from 'lucide-react';
import { useMeasurementProfiles } from '../../hooks/useMeasurementProfiles';
import { useSizeCharts } from '../../hooks/useSizeCharts';
import {
  MEASUREMENT_CATALOG,
  MEASUREMENT_GROUP_LABELS,
  checkMeasurementCoherence,
  measurementFieldsFor,
  validateMeasurementValues,
  FIT_GARMENT_TYPES,
  type FitGarmentType,
  type PatternExtParameters,
  type SizeChartGender,
} from '@angaly/types';
import { FitAdjustments } from './FitAdjustments';
import { MeasurementFieldCard } from './MeasurementFieldCard';
import type { FitChange } from '../../utils/fit-parameters';

interface MeasurementsStepProps {
  selectedProfileId?: string | undefined;
  measurements?: Record<string, number> | undefined;
  onSelectProfile: (profileId: string) => void;
  onUpdateMeasurement: (key: string, value: number) => void;
  onApplyMeasurements: (values: Record<string, number>) => void;
  /** Drives which measurements are required / recommended (undefined = the common essentials). */
  garmentType?: string | undefined;
  fit?: PatternExtParameters | undefined;
  /** Ease / fullness / lengths suggested by the photo analysis. */
  suggestedFit?: PatternExtParameters | undefined;
  onChangeFit?: ((change: FitChange) => void) | undefined;
}

// Vocabulaire canonique des mesures : `MEASUREMENT_CATALOG` (@angaly/types), partagé avec le
// profil "Mes mesures", la validation de l'API et le pattern-engine (test anti-dérive côté API).

const toFitGarment = (garmentType: string | undefined): FitGarmentType | null => {
  const g = (garmentType ?? '').toUpperCase();
  return (FIT_GARMENT_TYPES as readonly string[]).includes(g) ? (g as FitGarmentType) : null;
};

type MeasurementMode = 'MANUAL' | 'STANDARD_SIZE';

export const MeasurementsStep: React.FC<MeasurementsStepProps> = ({
  selectedProfileId,
  measurements = {},
  onSelectProfile,
  onUpdateMeasurement,
  onApplyMeasurements,
  garmentType,
  fit,
  suggestedFit,
  onChangeFit,
}) => {
  const { data: profiles = [] } = useMeasurementProfiles();
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [mode, setMode] = useState<MeasurementMode>('MANUAL');
  const [gender, setGender] = useState<SizeChartGender>('FEMME');
  const [showOthers, setShowOthers] = useState(false);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null);
  const { data: sizeChart = [], isLoading: isSizeChartLoading } = useSizeCharts(gender);

  const garment = toFitGarment(garmentType);
  const primaryFields = measurementFieldsFor(garment);
  const primaryKeys = new Set(primaryFields.map((f) => f.key));
  const otherFields = MEASUREMENT_CATALOG.filter((m) => !primaryKeys.has(m.key));
  const { issues } = validateMeasurementValues(measurements);
  const issueByKey = new Map(issues.map((issue) => [issue.key, issue.message]));
  const coherenceWarnings = checkMeasurementCoherence(measurements);
  const missingRequired = primaryFields.filter(
    (f) => f.necessity === 'REQUIRED' && measurements[f.key] === undefined,
  );

  const handleSelectSize = (label: string, values: Record<string, number>) => {
    setSelectedSizeLabel(label);
    onApplyMeasurements(values);
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
            Vos mesures
          </h2>
          <p className="text-[#D8D3C8] text-sm font-light">
            Sélectionnez un profil enregistré, choisissez une taille standard ou renseignez vos mensurations pour ce modèle.
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
                  onClick={() => {
                    onSelectProfile(p.id);
                    onApplyMeasurements(p.values);
                    setSelectedSizeLabel(null);
                  }}
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

      {/* Mode toggle: mesures personnalisées / taille standard */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg bg-[#041329] p-1 border border-[#C5B190]/20">
          <button
            type="button"
            onClick={() => setMode('MANUAL')}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
              mode === 'MANUAL' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
            }`}
          >
            Mesures personnalisées
          </button>
          <button
            type="button"
            onClick={() => setMode('STANDARD_SIZE')}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              mode === 'STANDARD_SIZE' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" /> Taille standard
          </button>
        </div>
      </div>

      {mode === 'STANDARD_SIZE' && (
        <div className="mb-8 p-5 bg-[#0C2650]/80 rounded-xl border border-[#C5B190]/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-sm">Choisir une taille standard</h3>
            <div className="inline-flex rounded-lg bg-[#041329] p-1 border border-[#C5B190]/20">
              <button
                type="button"
                onClick={() => setGender('FEMME')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  gender === 'FEMME' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                Femme
              </button>
              <button
                type="button"
                onClick={() => setGender('HOMME')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  gender === 'HOMME' ? 'bg-[#C5B190] text-[#041329]' : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                Homme
              </button>
            </div>
          </div>

          {isSizeChartLoading ? (
            <p className="text-xs text-[#D8D3C8]/70">Chargement des tailles…</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {sizeChart.map((entry) => {
                const isSelected = selectedSizeLabel === entry.label;
                return (
                  <button
                    key={entry.label}
                    type="button"
                    onClick={() => handleSelectSize(entry.label, entry.measurements)}
                    className={`p-3 rounded-lg text-center border transition-all ${
                      isSelected
                        ? 'bg-[#041329] border-[#C5B190] ring-1 ring-[#C5B190]'
                        : 'bg-[#041329]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50'
                    }`}
                  >
                    <p className="text-white text-sm font-semibold">{entry.label}</p>
                    <p className="text-[#D8D3C8]/60 text-[10px] font-mono">FR {entry.frSize}</p>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-[#D8D3C8]/60 italic mt-3">
            La taille sélectionnée pré-remplit vos mensurations ci-dessous — vous pouvez ensuite
            les ajuster librement.
          </p>
        </div>
      )}

      {/* Manual Measurements Fields */}
      <div className="space-y-4">
        <h3 className="text-white font-medium text-sm">
          {mode === 'STANDARD_SIZE' ? 'Ajustez si besoin :' : profiles.length > 0 ? 'Ou ajustez vos mesures manuellement :' : 'Mensurations nécessaires :'}
        </h3>

        {missingRequired.length > 0 && (
          <p className="text-[11px] text-[#D8D3C8]/80" data-testid="missing-required">
            Indispensables pour générer : {missingRequired.map((f) => f.label.toLowerCase()).join(', ')}.
            Les autres mesures améliorent l’ajustement.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {primaryFields.map((field) => (
            <MeasurementFieldCard
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              hint={field.help}
              valueCm={measurements[field.key]}
              unit={unit}
              badge={field.necessity === 'REQUIRED' ? 'Indispensable' : 'Recommandé'}
              error={issueByKey.get(field.key)}
              onChangeCm={(v) => onUpdateMeasurement(field.key, v)}
            />
          ))}
        </div>

        {coherenceWarnings.length > 0 && (
          <ul className="text-[11px] text-amber-200/90 list-disc pl-5 space-y-1" data-testid="coherence-warnings">
            {coherenceWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        {otherFields.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowOthers((v) => !v)}
              aria-expanded={showOthers}
              className="text-xs text-[#C5B190] underline hover:text-white"
            >
              {showOthers ? 'Masquer les autres mesures' : 'Plus de mesures pour un ajustement parfait'}
            </button>
            {showOthers && (
              <div className="mt-4 space-y-6">
                {(Object.keys(MEASUREMENT_GROUP_LABELS) as Array<keyof typeof MEASUREMENT_GROUP_LABELS>).map(
                  (group) => {
                    const fields = otherFields.filter((f) => f.group === group);
                    if (fields.length === 0) return null;
                    return (
                      <div key={group}>
                        <p className="text-[#D8D3C8] text-xs uppercase tracking-wide mb-3">
                          {MEASUREMENT_GROUP_LABELS[group]}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {fields.map((field) => (
                            <MeasurementFieldCard
                              key={field.key}
                              fieldKey={field.key}
                              label={field.label}
                              hint={field.help}
                              valueCm={measurements[field.key]}
                              unit={unit}
                              error={issueByKey.get(field.key)}
                              onChangeCm={(v) => onUpdateMeasurement(field.key, v)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {onChangeFit && (
        <FitAdjustments
          garmentType={garmentType ?? ''}
          value={fit}
          suggested={suggestedFit}
          onChange={onChangeFit}
        />
      )}

      <p className="text-xs italic text-[#D8D3C8]/70 mt-6 text-center">
        Vos mesures sont des données personnelles protégées et ne sont utilisées que pour vos projets Angaly.
      </p>
    </div>
  );
};
