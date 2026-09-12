import React from 'react';

interface ColorSwatchPickerProps {
  title: string;
  options: readonly string[];
  selectedValue?: string | undefined;
  onSelect: (val: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  Ivoire: '#F6F2E9',
  Champagne: '#C5B190',
  Marine: '#061938',
  Blush: '#F4E8E8', // approximate
  Noir: '#000000',
  Personnalisée: 'conic-gradient(red, yellow, green, blue, magenta, red)', // multicolors or transparent
};

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({ title, options, selectedValue, onSelect }) => {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-xl text-primary-deep-navy mb-4">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => {
          const isSelected = selectedValue === opt;
          const bgStyle = COLOR_MAP[opt] ?? '#FFFFFF';
          const isGradient = bgStyle.includes('gradient');
          
          return (
            <div key={opt} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(opt)}
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  isSelected ? 'border-primary-deep-navy scale-110' : 'border-border'
                }`}
                style={isGradient ? { backgroundImage: bgStyle } : { backgroundColor: bgStyle }}
                aria-label={opt}
              />
              <span className={`text-xs ${isSelected ? 'font-bold text-primary-deep-navy' : 'text-slate'}`}>
                {opt}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
