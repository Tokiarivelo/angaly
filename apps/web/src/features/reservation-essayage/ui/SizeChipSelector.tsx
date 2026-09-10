'use client';

interface SizeChipSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
}

/** Section 1 — "Sélectionnez votre taille", verified on the real Stitch screen (chips 34–42). */
export function SizeChipSelector({ sizes, selectedSize, onSelect }: SizeChipSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Taille" className="flex flex-wrap gap-3">
      {sizes.map((size) => {
        const isSelected = size === selectedSize;
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(size)}
            className={`flex h-12 w-12 items-center justify-center border text-sm transition-colors duration-300 ${
              isSelected
                ? 'border-angaly-navy bg-angaly-navy text-white'
                : 'border-angaly-border bg-transparent text-angaly-navy hover:border-angaly-gold'
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
