import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { CUTS } from '../../consts/cuts.const';
import { usePatternSuggestion } from '../../hooks/usePatternSuggestion';

interface CutStepProps {
  selectedCut: string;
  onSelect: (cut: string) => void;
  garmentType: string;
  occasion: string | null;
  style: string | null;
}

export const CutStep: React.FC<CutStepProps> = ({
  selectedCut,
  onSelect,
  garmentType,
  occasion,
  style,
}) => {
  const { mutate: requestSuggestion, data, isPending } = usePatternSuggestion();

  const suggestedCut = data
    ? CUTS.find((cut) => cut.id === data.suggestion.suggestedCutType)
    : undefined;

  return (
    <div>
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
            Quelle coupe préférez-vous ?
          </h2>
          <p className="text-[#D8D3C8] text-sm font-light">
            La coupe définit l’architecture du vêtement et le tracé des lignes maîtresses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => requestSuggestion({ garmentType, occasion, style })}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190] transition-colors disabled:opacity-60 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isPending ? 'Analyse en cours…' : 'Obtenir une suggestion IA'}
        </button>
      </div>

      {data && (
        <div className="mb-6 p-4 rounded-xl bg-[#C5B190]/10 border border-[#C5B190]/40 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-[#D8D3C8]">
            Suggestion IA{data.isIndicativeOnly ? ' (indicative — confiance faible)' : ''} :{' '}
            <span className="text-white font-medium">
              {suggestedCut?.label ?? data.suggestion.suggestedCutType}
            </span>
          </p>
          {suggestedCut && suggestedCut.id !== selectedCut && (
            <button
              type="button"
              onClick={() => onSelect(suggestedCut.id)}
              className="px-3 py-1.5 rounded bg-[#C5B190] text-[#041329] text-xs font-semibold hover:bg-[#B59A70] transition-colors"
            >
              Appliquer cette coupe
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CUTS.map((cut) => {
          const isSelected = selectedCut === cut.id;

          return (
            <button
              key={cut.id}
              type="button"
              onClick={() => onSelect(cut.id)}
              className={`p-5 rounded-xl text-left border transition-all flex flex-col justify-between relative ${
                isSelected
                  ? 'bg-[#0C2650] border-[#C5B190] ring-1 ring-[#C5B190] shadow-md'
                  : 'bg-[#0C2650]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:bg-[#0C2650]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-medium text-base">{cut.label}</h3>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#C5B190] text-[#041329] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[#D8D3C8] text-xs font-light leading-relaxed">
                {cut.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
