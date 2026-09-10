import type { ProductAvailability } from '@angaly/types';

import { PRODUCT_STATUS_INDICATOR } from '../consts/queryKeys';

interface ProductStatusIndicatorProps {
  status: ProductAvailability;
}

/**
 * Dot + label, always shown (including AVAILABLE → "En stock") — verified
 * against the real Stitch screen. Deliberately NOT the shared
 * pret-a-porter-catalogue/ProductStatusBadge.tsx (corner pill, hidden for
 * AVAILABLE): the real product-detail screen uses a different treatment for
 * this context — see docs/pages/fiche-produit.md "Points d'attention".
 */
export function ProductStatusIndicator({ status }: ProductStatusIndicatorProps) {
  const { label, dotClassName, textClassName } = PRODUCT_STATUS_INDICATOR[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotClassName}`} aria-hidden="true" />
      <span className={`text-sm ${textClassName}`}>{label}</span>
    </div>
  );
}
