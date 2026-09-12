import React from 'react';
import { DETAIL_GROUPS } from '../../consts/details.const';

interface DetailsStepProps {
  selectedDetails: Record<string, string>;
  onSelectDetail: (group: string, value: string) => void;
}

export const DetailsStep: React.FC<DetailsStepProps> = ({
  selectedDetails,
  onSelectDetail,
}) => {
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Personnalisez les détails
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Ajustez chaque élément de confection selon vos préférences.
        </p>
      </div>

      <div className="space-y-6">
        {DETAIL_GROUPS.map((group) => (
          <div
            key={group.id}
            className="bg-[#0C2650]/60 border border-[#C5B190]/20 rounded-xl p-5"
          >
            <h3 className="text-white font-medium text-sm mb-3">
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = selectedDetails[group.id] === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectDetail(group.id, opt.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs transition-all border ${
                      isSelected
                        ? 'bg-[#C5B190] text-[#041329] border-[#C5B190] font-semibold shadow-sm'
                        : 'bg-[#041329] text-[#D8D3C8] border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
