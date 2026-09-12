import React from 'react';
import { Check } from 'lucide-react';
import { CUTS } from '../../consts/cuts.const';

interface CutStepProps {
  selectedCut: string;
  onSelect: (cut: string) => void;
}

export const CutStep: React.FC<CutStepProps> = ({ selectedCut, onSelect }) => {
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Quelle coupe préférez-vous ?
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          La coupe définit l’architecture du vêtement et le tracé des lignes maîtresses.
        </p>
      </div>

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
