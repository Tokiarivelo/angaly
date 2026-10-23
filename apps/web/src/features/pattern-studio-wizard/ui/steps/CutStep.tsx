import React from 'react';

import { Check, Sparkles } from 'lucide-react';

import type { AiProviderId } from '@angaly/types';

import { cutsFor } from '../../consts/garment-details.const';
import { usePatternSuggestion } from '../../hooks/usePatternSuggestion';
import { cutSketch } from '../../utils/garment-type-sketch';
import { SketchImage } from './OptionSketch';

interface CutStepProps {
  selectedCut: string;
  onSelect: (cut: string) => void;
  garmentType: string;
  occasion: string | null;
  style: string | null;
  aiProvider?: AiProviderId | undefined;
}

export const CutStep: React.FC<CutStepProps> = ({
  selectedCut,
  onSelect,
  garmentType,
  occasion,
  style,
  aiProvider,
}) => {
  const { mutate: requestSuggestion, data, isPending } = usePatternSuggestion();
  const cuts = cutsFor(garmentType);

  const failed = data?.suggestion.modelVersion.startsWith('fallback') ?? false;
  const suggestedCut = data
    ? cuts.find((cut) => cut.id === data.suggestion.suggestedCutType)
    : undefined;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        <div>
          <h2 className="mb-2 font-serif text-2xl font-light text-white sm:text-3xl">
            Quelle coupe préférez-vous ?
          </h2>
          <p className="text-sm font-light text-[#D8D3C8]">
            La coupe définit l’architecture du vêtement et le tracé des lignes maîtresses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => requestSuggestion({ garmentType, occasion, style, aiProvider })}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-[#C5B190]/30 bg-[#0C2650] px-3.5 py-2 text-xs font-semibold text-[#C5B190] transition-colors hover:border-[#C5B190] disabled:opacity-60 sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isPending
            ? 'Analyse en cours…'
            : failed
              ? 'Réessayer la suggestion IA'
              : data
                ? 'Régénérer la suggestion IA'
                : 'Obtenir une suggestion IA'}
        </button>
      </div>

      {failed && (
        <p role="status" className="mb-4 text-xs text-amber-300 italic">
          L’IA n’a pas pu répondre (modèle non configuré ou service indisponible) : la coupe
          proposée n’est qu’une valeur par défaut. Réessayez ou choisissez un autre modèle IA.
        </p>
      )}

      {data && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#C5B190]/40 bg-[#C5B190]/10 p-4">
          <p className="text-xs text-[#D8D3C8]">
            Suggestion IA{data.isIndicativeOnly ? ' (indicative — confiance faible)' : ''} :{' '}
            <span className="font-medium text-white">
              {suggestedCut?.label ?? data.suggestion.suggestedCutType}
            </span>
          </p>
          {suggestedCut && suggestedCut.id !== selectedCut && (
            <button
              type="button"
              onClick={() => onSelect(suggestedCut.id)}
              className="rounded bg-[#C5B190] px-3 py-1.5 text-xs font-semibold text-[#041329] transition-colors hover:bg-[#B59A70]"
            >
              Appliquer cette coupe
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cuts.map((cut) => {
          const isSelected = selectedCut === cut.id;

          return (
            <button
              key={cut.id}
              type="button"
              onClick={() => onSelect(cut.id)}
              className={`relative flex gap-4 rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-[#C5B190] bg-[#0C2650] shadow-md ring-1 ring-[#C5B190]'
                  : 'border-[#C5B190]/20 bg-[#0C2650]/60 hover:border-[#C5B190]/50 hover:bg-[#0C2650]'
              }`}
            >
              <span className="shrink-0 rounded-lg bg-[#F7F1E6] p-1.5">
                <SketchImage sketch={cutSketch(garmentType, cut.id)} className="h-[120px] w-20" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-base font-medium text-white">{cut.label}</h3>
                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C5B190] text-[#041329]">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </span>
                <span className="text-xs leading-relaxed font-light text-[#D8D3C8]">{cut.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
