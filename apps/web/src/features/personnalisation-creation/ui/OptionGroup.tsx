import React from 'react';

interface OptionGroupProps {
  title: string;
  options: readonly string[];
  selectedValue?: string | undefined;
  onSelect: (val: string) => void;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({ title, options, selectedValue, onSelect }) => {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-xl text-primary-deep-navy mb-4">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const isSelected = selectedValue === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors duration-200 ${
                isSelected
                  ? 'bg-primary-deep-navy border-primary-deep-navy text-white'
                  : 'bg-ivory border-border text-primary-deep-navy hover:border-primary-deep-navy'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
