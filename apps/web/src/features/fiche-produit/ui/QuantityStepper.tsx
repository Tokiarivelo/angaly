import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
}

/** Minimal +/- control, not shown as a distinct element on the real screen's static capture but required by the page spec. */
export function QuantityStepper({ quantity, max, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center border border-angaly-border">
      <button
        type="button"
        aria-label="Diminuer la quantité"
        disabled={quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="flex h-12 w-12 items-center justify-center text-angaly-navy disabled:opacity-40"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm text-angaly-navy" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        disabled={quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="flex h-12 w-12 items-center justify-center text-angaly-navy disabled:opacity-40"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
