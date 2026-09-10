import { ProductAvailability } from '@angaly/types';

export const QUERY_KEYS = { all: ['fiche-produit'] as const };

export const SIMILAR_PRODUCTS_LIMIT = 4;

/** Same fixed FR size order as pret-a-porter-catalogue, used only to sort a product's own sizes consistently. */
export const SIZE_SORT_ORDER = ['34', '36', '38', '40', '42', '44'] as const;

/**
 * Dot + label status indicator shown in the purchase panel — verified
 * against the real Stitch screen ("En stock" with a green dot), a different
 * visual treatment from the catalogue grid's corner-pill ProductStatusBadge
 * (which shows nothing for AVAILABLE). Same 5 states, dedicated styling per
 * context — see docs/pages/fiche-produit.md "Points d'attention".
 */
export const PRODUCT_STATUS_INDICATOR: Record<ProductAvailability, { label: string; dotClassName: string; textClassName: string }> = {
  [ProductAvailability.AVAILABLE]: {
    label: 'En stock',
    dotClassName: 'bg-angaly-success',
    textClassName: 'text-angaly-success',
  },
  [ProductAvailability.LAST_PIECE]: {
    label: 'Dernière pièce',
    dotClassName: 'bg-angaly-warning',
    textClassName: 'text-angaly-warning',
  },
  [ProductAvailability.OUT_OF_STOCK]: {
    label: 'Épuisé',
    dotClassName: 'bg-angaly-warm-gray',
    textClassName: 'text-angaly-slate',
  },
  [ProductAvailability.ON_ORDER]: {
    label: 'Sur commande — délai 3 semaines',
    dotClassName: 'bg-angaly-soft-navy',
    textClassName: 'text-angaly-soft-navy',
  },
  [ProductAvailability.RESERVED]: {
    label: 'Réservé',
    dotClassName: 'bg-angaly-slate',
    textClassName: 'text-angaly-slate',
  },
};
