import { randomBytes } from 'node:crypto';

/**
 * docs/features/quotes.md illustrates the reference as a zero-padded sequence
 * (`ANG-DEV-2026-00001`), but a true sequence needs an atomic DB counter this
 * project hasn't built. We reuse the random-suffix approach already chosen for
 * `appointments` (`appointment-reference.vo.ts`) instead: collision-free
 * without extra infrastructure, and — unlike appointments — `quotes` routes
 * are all auth-gated anyway (see docs/features/quotes.md "Endpoints
 * exposés"), so there is no unauthenticated-enumeration concern to weigh
 * against it either way.
 */
const QUOTE_NUMBER_PATTERN = /^ANG-DEV-\d{4}-[A-Za-z0-9_-]{8}$/;

export function generateQuoteNumber(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = randomBytes(6).toString('base64url');
  return `ANG-DEV-${year}-${suffix}`;
}

export function isValidQuoteNumber(value: string): boolean {
  return QUOTE_NUMBER_PATTERN.test(value);
}
