/**
 * Domain-local mirror of `ProductAvailability` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both enums in sync by hand.
 */
export const PRODUCT_AVAILABILITIES = ['AVAILABLE', 'LAST_PIECE', 'OUT_OF_STOCK', 'ON_ORDER', 'RESERVED'] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];

export function isProductAvailability(value: string): value is ProductAvailability {
  return (PRODUCT_AVAILABILITIES as readonly string[]).includes(value);
}
