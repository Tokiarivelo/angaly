import { PATTERN_DETAIL_OPTIONS } from '@angaly/types';

/** Single source of truth lives in @angaly/types (shared with the web and checked against the ai-service). */
export { PATTERN_DETAIL_OPTIONS };

export const isValidPatternDetail = (group: string, value: unknown): value is string =>
  typeof value === 'string' &&
  ((PATTERN_DETAIL_OPTIONS as Record<string, readonly string[]>)[group]?.includes(value) ?? false);
