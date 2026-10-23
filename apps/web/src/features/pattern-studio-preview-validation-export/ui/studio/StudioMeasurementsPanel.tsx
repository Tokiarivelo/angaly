import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getMeasurementDefinition, measurementFieldsFor, type FitGarmentType } from '@angaly/types';
import { NumberField } from './NumberField';

interface StudioMeasurementsPanelProps {
  garmentType: string;
  measurements: Record<string, number> | null;
  isRegenerating: boolean;
  /** True when the studio holds unsaved hand edits that a regeneration would leave behind. */
  hasUnsavedEdits: boolean;
  onRegenerate: (measurements: Record<string, number>) => void;
}

/** Body measurements (cm) that drive the engine: change them, regenerate, the pattern is redrawn. */
export const StudioMeasurementsPanel: React.FC<StudioMeasurementsPanelProps> = ({
  garmentType,
  measurements,
  isRegenerating,
  hasUnsavedEdits,
  onRegenerate,
}) => {
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const fields = useMemo(() => {
    const catalogue = measurementFieldsFor(garmentType as FitGarmentType);
    const known = new Set(catalogue.map((f) => f.key));
    const extra = Object.keys(measurements ?? {})
      .filter((key) => !known.has(key))
      .map((key) => getMeasurementDefinition(key))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({ ...d, necessity: 'RECOMMENDED' as const }));
    return [...catalogue, ...extra];
  }, [garmentType, measurements]);

  const merged = { ...(measurements ?? {}), ...overrides };
  const changed = Object.keys(overrides).length > 0;

  const regenerate = (): void => {
    if (
      hasUnsavedEdits &&
      !window.confirm('Vos retouches non enregistrées ne seront pas reprises dans le nouveau patron. Continuer ?')
    ) {
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0),
    );
    onRegenerate(payload);
    setOverrides({});
  };

  return (
    <div className="flex flex-col gap-3" data-testid="studio-measurements">
      <p className="text-[11px] leading-relaxed text-[#D8D3C8]/80">
        Modifiez les mesures du corps puis régénérez : le moteur redessine toutes les pièces (une nouvelle version est créée,
        l’ancienne reste restaurable).
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {fields.map((field) => (
          <NumberField
            key={field.key}
            label={`${field.label}${field.necessity === 'REQUIRED' ? ' *' : ''}`}
            value={merged[field.key] ?? 0}
            min={field.minCm}
            max={field.maxCm}
            step={0.5}
            suffix="cm"
            onCommit={(v) => setOverrides((o) => ({ ...o, [field.key]: v }))}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={regenerate}
        disabled={!changed || isRegenerating}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C5B190] bg-[#C5B190] px-3 py-2 text-xs font-semibold text-[#041329] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isRegenerating ? 'Régénération…' : 'Régénérer avec ces mesures'}
      </button>
    </div>
  );
};
