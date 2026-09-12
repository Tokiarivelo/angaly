import React from 'react';
import { Check, Sparkles, Shirt, Scissors, Layers, Crown, Heart, Compass } from 'lucide-react';
import { GARMENT_TYPES } from '../../consts/garment-types.const';

interface GarmentTypeStepProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

export const GarmentTypeStep: React.FC<GarmentTypeStepProps> = ({ selectedType, onSelect }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Shirt':
        return <Shirt className="w-6 h-6" />;
      case 'Scissors':
        return <Scissors className="w-6 h-6" />;
      case 'Layers':
        return <Layers className="w-6 h-6" />;
      case 'Crown':
        return <Crown className="w-6 h-6" />;
      case 'Heart':
        return <Heart className="w-6 h-6" />;
      case 'Compass':
        return <Compass className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Quel vêtement souhaitez-vous créer ?
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Sélectionnez la base géométrique de votre création.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {GARMENT_TYPES.map((item) => {
          const isSelected = selectedType === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`p-5 rounded-xl text-left flex flex-col justify-between transition-all relative border ${
                isSelected
                  ? 'bg-[#0C2650] border-[#C5B190] shadow-lg shadow-[#C5B190]/10 ring-1 ring-[#C5B190]'
                  : 'bg-[#0C2650]/60 border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:bg-[#0C2650]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-6">
                <span
                  className={`p-2.5 rounded-lg ${
                    isSelected
                      ? 'bg-[#C5B190] text-[#041329]'
                      : 'bg-[#041329] text-[#C5B190] border border-[#C5B190]/20'
                  }`}
                >
                  {getIcon(item.iconName)}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#C5B190] text-[#041329] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-white font-medium text-sm mb-1">{item.label}</h3>
                <p className="text-[#D8D3C8]/70 text-xs font-light leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
