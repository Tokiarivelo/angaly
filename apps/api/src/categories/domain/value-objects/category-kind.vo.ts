/**
 * Domain-local mirror of `CategoryKind` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both enums in sync by hand.
 */
export const CATEGORY_KINDS = ['CREATION', 'PRODUCT', 'BLOG'] as const;

export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export function isCategoryKind(value: string): value is CategoryKind {
  return (CATEGORY_KINDS as readonly string[]).includes(value);
}
