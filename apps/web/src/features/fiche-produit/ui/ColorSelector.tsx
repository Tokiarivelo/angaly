import { getColorSwatchHex } from '@/lib/color-swatches';

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string | null;
  onSelect: (color: string) => void;
}

/** Circular swatches, thin navy ring on the selected one — verified against the real Stitch screen. */
export function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
  return (
    <div>
      <span className="mb-3 block text-sm tracking-wider text-angaly-navy uppercase">
        Couleur{selectedColor ? ` : ${selectedColor}` : ''}
      </span>
      <div className="flex gap-4">
        {colors.map((color) => {
          const isSelected = color === selectedColor;
          const hex = getColorSwatchHex(color);
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={isSelected}
              onClick={() => onSelect(color)}
              className={`h-8 w-8 rounded-full border-2 border-angaly-ivory outline outline-1 transition-all ${
                isSelected ? 'outline-angaly-navy' : 'outline-transparent hover:outline-angaly-border'
              } ${hex === '#FFFFFF' ? 'ring-1 ring-angaly-border' : ''}`}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
