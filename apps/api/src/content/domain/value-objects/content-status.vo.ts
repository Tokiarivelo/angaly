/**
 * Domain-local mirrors of `ContentStatus`/`Locale` (`@angaly/types` /
 * schema.prisma) — the Domain layer must not import `@angaly/types`
 * (.cursor/rules/003-nestjs-clean-arch.mdc), keep both in sync by hand.
 */
export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ContentStatusValue = (typeof CONTENT_STATUSES)[number];

export const LOCALES = ['FR', 'MG'] as const;
export type LocaleValue = (typeof LOCALES)[number];

export function isContentStatus(value: string): value is ContentStatusValue {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}

export function isLocale(value: string): value is LocaleValue {
  return (LOCALES as readonly string[]).includes(value);
}
