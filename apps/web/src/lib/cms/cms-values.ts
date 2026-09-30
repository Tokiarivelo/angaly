/** Small readers for CMS values — a blank/missing/wrongly-typed value always falls back to the default. */

type JsonObject = Record<string, unknown>;

export function asRecord(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}

/** The CMS text when it has any content, else the default. */
export function cmsText(value: string | null | undefined, fallback: string): string {
  return value !== null && value !== undefined && value.trim() !== '' ? value : fallback;
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** `dataJson.<key>` as a string. */
export function dataString(dataJson: unknown, key: string): string | undefined {
  return readString(asRecord(dataJson)?.[key]);
}

/**
 * `dataJson.<key>` as a list parsed item by item (`parse` returns `undefined` to drop a malformed item).
 * `undefined` when the list is missing or ends up empty — the caller keeps its default list.
 */
export function cmsList<T>(dataJson: unknown, key: string, parse: (item: JsonObject) => T | undefined): T[] | undefined {
  const raw = asRecord(dataJson)?.[key];
  if (!Array.isArray(raw)) return undefined;
  const items = raw.flatMap((entry) => {
    const item = asRecord(entry);
    const parsed = item ? parse(item) : undefined;
    return parsed === undefined ? [] : [parsed];
  });
  return items.length > 0 ? items : undefined;
}

/** A pick among fixed values (e.g. an icon name); anything else is dropped. */
export function readOneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
