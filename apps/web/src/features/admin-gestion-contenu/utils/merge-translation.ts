/**
 * Editor-side mirror of the API's `localizeSection` (apps/api/src/content/domain/services/localize-section.ts):
 * what the public site will show for a translation — translated copy where present, the base (FR) value
 * otherwise, and the base's media always. Used for the preview and to size/lock the translated lists.
 */

/** Item keys that are media, not copy — always inherited from the base-locale item at the same index. */
export const SHARED_ITEM_KEYS: readonly string[] = ['imageUrl', 'mediaId'];

type JsonObject = Record<string, unknown>;

export function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}

function hasText(value: unknown): boolean {
  return value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '');
}

export function pickText(translated: string | null | undefined, base: string | null | undefined): string | null {
  return translated !== null && translated !== undefined && translated.trim() !== '' ? translated : (base ?? null);
}

function mergeItem(baseItem: unknown, translatedItem: unknown): unknown {
  const base = asObject(baseItem);
  const translated = asObject(translatedItem);
  if (!base) return translatedItem ?? baseItem;
  if (!translated) return base;

  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(translated)) {
    if (!SHARED_ITEM_KEYS.includes(key) && hasText(value)) merged[key] = value;
  }
  return merged;
}

export function mergeTranslatedData(baseData: unknown, translatedData: unknown): JsonObject | null {
  const base = asObject(baseData);
  const translated = asObject(translatedData);
  if (!translated) return base;
  if (!base) return translated;

  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(translated)) {
    const baseValue = base[key];
    if (Array.isArray(baseValue) && Array.isArray(value)) {
      merged[key] = baseValue.map((baseItem, index) => mergeItem(baseItem, value[index]));
    } else if (hasText(value)) {
      merged[key] = value;
    }
  }
  return merged;
}
