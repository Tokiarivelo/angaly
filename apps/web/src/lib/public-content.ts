import type { Locale } from '@/stores/locale.store';

/**
 * Public CMS read path for one page in the visitor's language — the API returns the translation layered over
 * the French base (untranslated fields and every image fall back to / come from French).
 */
export function publicContentPath(page: string, locale: Locale): string {
  return `/content/public/${page}?locale=${locale}`;
}
