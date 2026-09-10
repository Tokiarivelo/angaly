/**
 * Domain-local mirror of `QuoteStatus` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose — the Domain layer must not import `@angaly/types`
 * (.cursor/rules/003-nestjs-clean-arch.mdc).
 */
export const QUOTE_STATUSES = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

/**
 * Valid transitions (docs/features/quotes.md): DRAFT→SENT→VIEWED→ACCEPTED/REJECTED,
 * →EXPIRED from SENT or VIEWED. ACCEPTED/REJECTED/EXPIRED are terminal — no
 * transition out (a rejected/expired quote is re-quoted as a new `Quote` row,
 * this module never resurrects one).
 */
const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function canTransitionQuoteStatus(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_STATUS_TRANSITIONS[from].includes(to);
}

/** Throws with a message safe to surface via ConflictException (409). */
export function assertQuoteStatusTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (!canTransitionQuoteStatus(from, to)) {
    throw new Error(`Cannot transition Quote from "${from}" to "${to}"`);
  }
}
