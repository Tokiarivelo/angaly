interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  isSizeAvailable: (size: string) => boolean;
  onSelect: (size: string) => void;
}

/** Chips (filled navy = selected, greyed/disabled = out of stock) — verified against the real Stitch screen. */
export function SizeSelector({ sizes, selectedSize, isSizeAvailable, onSelect }: SizeSelectorProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm tracking-wider text-angaly-navy uppercase">Taille (FR)</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {sizes.map((size) => {
          const isSelected = size === selectedSize;
          const isAvailable = isSizeAvailable(size);
          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              aria-pressed={isSelected}
              aria-label={isAvailable ? `Taille ${size}` : `Taille ${size} — épuisée`}
              onClick={() => onSelect(size)}
              className={`flex h-12 w-12 items-center justify-center border text-sm transition-colors ${
                isSelected
                  ? 'border-angaly-navy bg-angaly-navy text-white'
                  : isAvailable
                    ? 'border-angaly-border text-angaly-navy hover:border-angaly-navy'
                    : 'cursor-not-allowed border-angaly-border text-angaly-slate opacity-50'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
