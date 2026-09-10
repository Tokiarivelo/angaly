import { ProductAvailability } from '@angaly/types';

export const QUERY_KEYS = { all: ['pret-a-porter-catalogue'] as const };

export const CATALOGUE_PAGE_SIZE = 12;

/**
 * Sizes offered as a filter (FR sizing) — matches the real Stitch sidebar's
 * button grid exactly (34/36/38/40/42/44), not a value read from the API:
 * `ProductVariant.size` is a free-form string, there's no fixed enum to
 * enumerate from the backend (see docs/features/products.md).
 */
export const CATALOGUE_SIZES = ['34', '36', '38', '40', '42', '44'] as const;

/**
 * Swatch palette shown in the sidebar's Couleur filter — matches the real
 * Stitch screen exactly (5 dots: Navy/White/Champagne/Black/Grey). Colors
 * beyond this palette are simply never offered as a *filter value* (still
 * rendered correctly as a swatch dot on a product card via
 * PRODUCT_SWATCH_HEX, see ProductCard.tsx).
 */
export const CATALOGUE_COLOR_FILTERS: { label: string; hex: string }[] = [
  { label: 'Navy', hex: '#061938' },
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Champagne', hex: '#C5B190' },
  { label: 'Black', hex: '#000000' },
  { label: 'Grey', hex: '#8A877F' },
];

export const CATALOGUE_SORT_OPTIONS: { value: 'newest' | 'priceAsc' | 'priceDesc'; label: string }[] = [
  { value: 'newest', label: 'Nouveautés' },
  { value: 'priceAsc', label: 'Prix croissant' },
  { value: 'priceDesc', label: 'Prix décroissant' },
];

/** French labels for the Disponibilité filter — same 5 states as ProductStatusBadge.tsx. */
export const CATALOGUE_STATUS_LABELS: { value: ProductAvailability; label: string }[] = [
  { value: ProductAvailability.AVAILABLE, label: 'Disponible' },
  { value: ProductAvailability.LAST_PIECE, label: 'Dernière pièce' },
  { value: ProductAvailability.ON_ORDER, label: 'Sur commande' },
  { value: ProductAvailability.RESERVED, label: 'Réservé' },
  { value: ProductAvailability.OUT_OF_STOCK, label: 'Épuisé' },
];
