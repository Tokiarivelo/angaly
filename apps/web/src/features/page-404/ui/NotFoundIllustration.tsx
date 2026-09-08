import { Shirt } from 'lucide-react';

/**
 * Real screen's hero illustration is a "delicate champagne gold thread silhouette of a
 * couture dress" — a decorative asset, not a stock photo. Rather than fabricate/source an
 * external illustration for a single utility page, a large translucent champagne icon
 * reproduces the same "delicate, mix-blend-multiply" mood without a new asset dependency
 * (spec's own note: no heavy illustration library for something this simple).
 */
export function NotFoundIllustration() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mb-12 flex aspect-video w-full max-w-md items-center justify-center"
    >
      <Shirt className="h-32 w-32 text-angaly-champagne opacity-90" strokeWidth={0.75} />
    </div>
  );
}
