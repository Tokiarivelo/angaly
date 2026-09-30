import type { PageSectionEntity } from '../entities/page-section.entity';

/** The locale every section is authored in first — translations layer over it and inherit its media. */
export const BASE_LOCALE = 'FR';

/**
 * Keys of a `dataJson` list item that are media/layout, not copy: a translation always takes them from the
 * base-locale item at the same index, so uploading an image once (in FR) is enough for every language.
 */
export const SHARED_ITEM_KEYS = ['imageUrl', 'mediaId'] as const;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() !== '';
}

/** Translated copy over the base item: only non-empty translated values win; shared media keys always come from the base. */
function mergeItem(baseItem: unknown, localizedItem: unknown): unknown {
  if (!isObject(baseItem)) return localizedItem ?? baseItem;
  if (!isObject(localizedItem)) return baseItem;

  const merged: JsonObject = { ...baseItem };
  for (const [key, value] of Object.entries(localizedItem)) {
    if ((SHARED_ITEM_KEYS as readonly string[]).includes(key)) continue;
    if (value !== null && value !== undefined && hasText(value)) merged[key] = value;
  }
  return merged;
}

/**
 * Lists follow the base locale's structure (same length, same order — add/remove/reorder happens in FR);
 * each entry is the translated copy over the base item. Scalars: translated value if present, else base.
 */
export function mergeDataJson(base: unknown, localized: unknown): unknown {
  if (!isObject(localized)) return base ?? localized ?? null;
  if (!isObject(base)) return localized;

  const merged: JsonObject = { ...base };
  for (const [key, localizedValue] of Object.entries(localized)) {
    const baseValue = base[key];
    if (Array.isArray(baseValue) && Array.isArray(localizedValue)) {
      merged[key] = baseValue.map((baseItem, index) => mergeItem(baseItem, localizedValue[index]));
    } else if (localizedValue !== null && localizedValue !== undefined && hasText(localizedValue)) {
      merged[key] = localizedValue;
    }
  }
  return merged;
}

function pick(localized: string | null, base: string | null): string | null {
  return localized !== null && localized.trim() !== '' ? localized : base;
}

/**
 * Resolves one section for a non-base locale: the translated copy where it exists, the base (FR) value
 * otherwise, and the base's image(s) always — images are shared across languages. `undefined` when neither exists.
 */
export function localizeSection(
  base: PageSectionEntity | undefined,
  localized: PageSectionEntity | undefined,
): PageSectionEntity | undefined {
  if (!localized) return base;
  if (!base) return localized;

  return localized.withOverrides({
    titleText: pick(localized.titleText, base.titleText),
    subtitleText: pick(localized.subtitleText, base.subtitleText),
    bodyText: pick(localized.bodyText, base.bodyText),
    ctaPrimaryLabel: pick(localized.ctaPrimaryLabel, base.ctaPrimaryLabel),
    ctaSecondaryLabel: pick(localized.ctaSecondaryLabel, base.ctaSecondaryLabel),
    dataJson: mergeDataJson(base.dataJson, localized.dataJson),
    mediaId: base.mediaId,
    media: base.media,
  });
}
