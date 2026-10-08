import React from 'react';
import { Cpu } from 'lucide-react';
import type { AiProviderId, SelectableAiProvider } from '@angaly/types';

interface AiModelSelectorProps {
  providers: SelectableAiProvider[];
  value: AiProviderId | undefined;
  onChange: (provider: AiProviderId | undefined) => void;
  disabled?: boolean | undefined;
}

/** Presentational picker of the AI model used for suggestions and missing-measurement estimation. */
export const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  providers,
  value,
  onChange,
  disabled = false,
}) => {
  if (providers.length === 0) {
    // Never silently absent: tell the user which model is used when the list cannot be offered.
    return (
      <p
        data-testid="ai-model-automatic"
        className="mt-4 px-1 inline-flex items-center gap-1.5 text-xs text-[#D8D3C8]/80"
      >
        <Cpu className="w-3.5 h-3.5 text-[#C5B190]" aria-hidden="true" />
        Modèle IA : automatique (réglage de l’atelier)
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-1">
      <label
        htmlFor="wizard-ai-model"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#C5B190]"
      >
        <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
        Modèle IA
      </label>
      <select
        id="wizard-ai-model"
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? (e.target.value as AiProviderId) : undefined)}
        className="bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#C5B190] disabled:opacity-60"
      >
        <option value="">Automatique (réglage de l’atelier)</option>
        {providers.map((p) => (
          <option key={p.provider} value={p.provider}>
            {p.name} — {p.model}
            {p.readsPhotos === false ? ' (mesures — photos lues par un modèle de repli)' : ''}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-[#D8D3C8]/70">
        Le tracé reste calculé par le moteur géométrique ; le modèle propose et estime.
      </span>
    </div>
  );
};
