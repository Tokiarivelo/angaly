import React from 'react';

interface FabricSwatchPickerProps {
  title: string;
  options: readonly string[];
  selectedValue?: string | undefined;
  onSelect: (val: string) => void;
}

export const FabricSwatchPicker: React.FC<FabricSwatchPickerProps> = ({ title, options, selectedValue, onSelect }) => {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-xl text-primary-deep-navy mb-4">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => {
          const isSelected = selectedValue === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`flex items-center justify-center w-24 h-24 rounded-md border p-2 text-sm text-center transition-all ${
                isSelected
                  ? 'border-primary-deep-navy bg-primary-deep-navy text-white shadow-md'
                  : 'border-border bg-ivory text-primary-deep-navy hover:border-primary-deep-navy'
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
