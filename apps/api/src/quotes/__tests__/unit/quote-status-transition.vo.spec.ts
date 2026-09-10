import type {
  QuoteStatus} from '../../domain/value-objects/quote-status-transition.vo';
import {
  assertQuoteStatusTransition,
  canTransitionQuoteStatus,
  QUOTE_STATUSES
} from '../../domain/value-objects/quote-status-transition.vo';

const VALID_TRANSITIONS: [QuoteStatus, QuoteStatus][] = [
  ['DRAFT', 'SENT'],
  ['SENT', 'VIEWED'],
  ['SENT', 'ACCEPTED'],
  ['SENT', 'REJECTED'],
  ['SENT', 'EXPIRED'],
  ['VIEWED', 'ACCEPTED'],
  ['VIEWED', 'REJECTED'],
  ['VIEWED', 'EXPIRED'],
];

describe('canTransitionQuoteStatus', () => {
  it.each(VALID_TRANSITIONS)('allows %s -> %s', (from, to) => {
    expect(canTransitionQuoteStatus(from, to)).toBe(true);
  });

  it('rejects every transition out of a terminal status', () => {
    for (const terminal of ['ACCEPTED', 'REJECTED', 'EXPIRED'] as const) {
      for (const to of QUOTE_STATUSES) {
        expect(canTransitionQuoteStatus(terminal, to)).toBe(false);
      }
    }
  });

  it('rejects skipping DRAFT straight to VIEWED/ACCEPTED/REJECTED/EXPIRED', () => {
    expect(canTransitionQuoteStatus('DRAFT', 'VIEWED')).toBe(false);
    expect(canTransitionQuoteStatus('DRAFT', 'ACCEPTED')).toBe(false);
    expect(canTransitionQuoteStatus('DRAFT', 'REJECTED')).toBe(false);
    expect(canTransitionQuoteStatus('DRAFT', 'EXPIRED')).toBe(false);
  });

  it('rejects going backwards from VIEWED to SENT', () => {
    expect(canTransitionQuoteStatus('VIEWED', 'SENT')).toBe(false);
  });
});

describe('assertQuoteStatusTransition', () => {
  it('does not throw for a valid transition', () => {
    expect(() => assertQuoteStatusTransition('DRAFT', 'SENT')).not.toThrow();
  });

  it('throws for an invalid transition', () => {
    expect(() => assertQuoteStatusTransition('ACCEPTED', 'SENT')).toThrow(
      'Cannot transition Quote from "ACCEPTED" to "SENT"',
    );
  });
});
