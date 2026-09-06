/**
 * Domain-local mirror of `Locale` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both enums in sync by hand.
 */
export const SUPPORTED_LOCALES = ['FR', 'MG'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'FR';

/** Exact (case-sensitive) match against SUPPORTED_LOCALES — use normalizeLocale() for user input. */
export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Case-insensitive match against SUPPORTED_LOCALES, or null when unrecognized/absent. */
export function normalizeLocale(value: string | undefined | null): Locale | null {
  if (!value) {
    return null;
  }
  const upper = value.trim().toUpperCase();
  return isLocale(upper) ? upper : null;
}

/**
 * Picks the first supported locale from an `Accept-Language` header
 * (e.g. "fr-FR,fr;q=0.9,mg;q=0.8"), ignoring quality values — good enough
 * for a two-locale (FR/MG) site; revisit with a proper q-value sort if a
 * third locale is ever added.
 */
export function parseAcceptLanguage(header: string | undefined | null): Locale | null {
  if (!header) {
    return null;
  }
  for (const entry of header.split(',')) {
    const tag = entry.split(';')[0]?.trim().split('-')[0];
    const locale = normalizeLocale(tag);
    if (locale) {
      return locale;
    }
  }
  return null;
}
