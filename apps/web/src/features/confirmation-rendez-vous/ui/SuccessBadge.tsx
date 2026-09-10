import { Check } from 'lucide-react';

/** Double champagne ring + check icon, verified on the real Stitch screen. */
export function SuccessBadge() {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-angaly-champagne/40 p-1.5">
      <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-angaly-champagne">
        <Check className="h-8 w-8 text-angaly-success" aria-hidden="true" />
      </div>
    </div>
  );
}
