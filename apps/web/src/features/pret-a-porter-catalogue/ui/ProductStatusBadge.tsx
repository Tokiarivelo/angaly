import { ProductAvailability } from '@angaly/types';

interface ProductStatusBadgeProps {
  status: ProductAvailability;
}

/**
 * One dedicated style per status (docs/pages/pret-a-porter-catalogue.md
 * "Points d'attention" — never duplicate this color logic elsewhere).
 * AVAILABLE renders nothing (verified against the real Stitch screen: no
 * badge on in-stock cards). OUT_OF_STOCK is centered over the whole image
 * (`inset-0`), every other status is a top-left corner pill — ProductCard.tsx
 * positions this component accordingly and desaturates the image itself for
 * OUT_OF_STOCK.
 */
export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  if (status === ProductAvailability.AVAILABLE) {
    return null;
  }

  if (status === ProductAvailability.OUT_OF_STOCK) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/10">
        <span className="border border-angaly-border bg-angaly-ivory px-4 py-2 text-xs tracking-wider text-angaly-slate uppercase">
          Épuisé
        </span>
      </div>
    );
  }

  const badgeByStatus: Record<Exclude<ProductAvailability, 'AVAILABLE' | 'OUT_OF_STOCK'>, { label: string; className: string }> = {
    [ProductAvailability.LAST_PIECE]: {
      label: 'Dernière pièce',
      className: 'border border-angaly-border/50 bg-angaly-ivory/90 text-angaly-warning backdrop-blur-sm',
    },
    [ProductAvailability.ON_ORDER]: {
      label: 'Sur commande — délai 3 semaines',
      className: 'bg-angaly-soft-navy text-white',
    },
    [ProductAvailability.RESERVED]: {
      label: 'Réservé',
      className: 'bg-angaly-slate text-white',
    },
  };

  const badge = badgeByStatus[status];

  return (
    <span
      className={`absolute top-4 left-4 px-3 py-1 text-[10px] tracking-wider uppercase ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
