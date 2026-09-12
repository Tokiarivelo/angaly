import React from 'react';
import { OCCASIONS } from '../../consts/occasions.const';

interface OccasionStepProps {
  selectedOccasion: string;
  onSelect: (occasion: string) => void;
}

export const OccasionStep: React.FC<OccasionStepProps> = ({ selectedOccasion, onSelect }) => {
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Pour quelle occasion ?
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          L’occasion oriente les aisances techniques et l’allure générale.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {OCCASIONS.map((occ) => {
          const isSelected = selectedOccasion === occ.id;

          return (
            <button
              key={occ.id}
              type="button"
              onClick={() => onSelect(occ.id)}
              className={`px-6 py-3.5 rounded-xl text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-[#C5B190] text-[#041329] border-[#C5B190] shadow-md shadow-[#C5B190]/20 font-semibold'
                  : 'bg-[#0C2650] text-[#D8D3C8] border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:text-white'
              }`}
            >
              {occ.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
