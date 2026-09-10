import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';

function buildProps(overrides: Partial<QuoteProps> = {}): QuoteProps {
  return {
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Robe de mariée sur mesure',
    lineItems: [],
    subtotal: '0.00',
    depositAmount: '0.00',
    balanceAmount: '0.00',
    total: '0.00',
    status: 'DRAFT',
    validUntil: null,
    estimatedDelayDays: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('QuoteEntity.create', () => {
  it('creates a valid fresh draft with no line items', () => {
    const quote = QuoteEntity.create(buildProps());
    expect(quote.status).toBe('DRAFT');
    expect(quote.lineItems).toEqual([]);
  });

  it('creates a valid priced quote whose subtotal matches its line items', () => {
    const quote = QuoteEntity.create(
      buildProps({
        lineItems: [
          { label: 'Tissu satin', quantity: 3, unitPrice: '20.00' },
          { label: 'Confection', quantity: 1, unitPrice: '140.00' },
        ],
        subtotal: '200.00',
        depositAmount: '60.00',
        balanceAmount: '140.00',
        total: '200.00',
        status: 'SENT',
      }),
    );
    expect(quote.subtotal).toBe('200.00');
  });

  it.each(['', '   '])('rejects an empty quoteNumber (%j)', (quoteNumber) => {
    expect(() => QuoteEntity.create(buildProps({ quoteNumber }))).toThrow('Quote.quoteNumber must not be empty');
  });

  it('rejects an empty customerId', () => {
    expect(() => QuoteEntity.create(buildProps({ customerId: '' }))).toThrow('Quote.customerId must not be empty');
  });

  it('rejects an empty description', () => {
    expect(() => QuoteEntity.create(buildProps({ description: '' }))).toThrow('Quote.description must not be empty');
  });

  it('rejects an unrecognized status', () => {
    expect(() => QuoteEntity.create(buildProps({ status: 'BOGUS' }))).toThrow(
      'Quote.status must be a recognized QuoteStatus, got "BOGUS"',
    );
  });

  it('rejects a line item with a blank label', () => {
    expect(() =>
      QuoteEntity.create(buildProps({ lineItems: [{ label: '  ', quantity: 1, unitPrice: '10.00' }], subtotal: '10.00' })),
    ).toThrow('QuoteLineItem.label must not be empty');
  });

  it('rejects a line item with a non-positive quantity', () => {
    expect(() =>
      QuoteEntity.create(buildProps({ lineItems: [{ label: 'Tissu', quantity: 0, unitPrice: '10.00' }], subtotal: '0.00' })),
    ).toThrow('QuoteLineItem.quantity must be > 0');
  });

  it('rejects a line item with a malformed unitPrice', () => {
    expect(() =>
      QuoteEntity.create(buildProps({ lineItems: [{ label: 'Tissu', quantity: 1, unitPrice: '-5' }], subtotal: '-5' })),
    ).toThrow('QuoteLineItem.unitPrice must be a non-negative decimal string with at most 2 decimal places');
  });

  it('rejects a subtotal that does not match the sum of line items', () => {
    expect(() =>
      QuoteEntity.create(
        buildProps({ lineItems: [{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }], subtotal: '999.00' }),
      ),
    ).toThrow('Quote.subtotal must equal the sum of lineItems (quantity × unitPrice)');
  });

  it('rejects deposit + balance not matching total', () => {
    expect(() =>
      QuoteEntity.create(buildProps({ depositAmount: '50.00', balanceAmount: '40.00', total: '200.00' })),
    ).toThrow('Quote.depositAmount + Quote.balanceAmount must equal Quote.total');
  });

  it('rejects a malformed total', () => {
    expect(() => QuoteEntity.create(buildProps({ total: 'not-a-number' }))).toThrow(
      'Quote.total must be a non-negative decimal string with at most 2 decimal places',
    );
  });

  it('tolerates floating-point rounding within a cent', () => {
    expect(() =>
      QuoteEntity.create(
        buildProps({
          lineItems: [{ label: 'Tissu', quantity: 3, unitPrice: '0.10' }],
          subtotal: '0.30',
        }),
      ),
    ).not.toThrow();
  });
});
