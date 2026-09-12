import React from 'react';
import { Check } from 'lucide-react';
import { STYLES } from '../../consts/styles.const';

interface StyleStepProps {
  selectedStyle: string;
  onSelect: (style: string) => void;
}

export const StyleStep: React.FC<StyleStepProps> = ({ selectedStyle, onSelect }) => {
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Quel style vous correspond ?
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Choisissez l’ambiance stylistique de votre modèle.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={`p-5 rounded-xl text-left border transition-all relative ${
                isSelected
                  ? 'bg-[#0C2650] border-[#C5B190] ring-1 ring-[#C5B190] shadow-md'
                  : 'bg-[#0C2650]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:bg-[#0C2650]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg text-white font-medium">
                  {style.label}
                </h3>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#C5B190] text-[#041329] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[#D8D3C8] text-xs font-light leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
