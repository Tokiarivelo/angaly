export const MIN_SEARCH_QUERY_LENGTH = 2;

/** Trims and validates a raw search string — throws below MIN_SEARCH_QUERY_LENGTH. */
export function normalizeSearchQuery(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
    throw new Error(`Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`);
  }
  return trimmed;
}
