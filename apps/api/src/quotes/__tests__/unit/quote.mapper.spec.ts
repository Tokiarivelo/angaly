import { QuoteMapper } from '../../infrastructure/mappers/quote.mapper';
import type { QuoteRecord } from '../../infrastructure/repositories/prisma-quote.repository';

function decimal(value: string): QuoteRecord['subtotal'] {
  return { toString: () => value } as QuoteRecord['subtotal'];
}

function sampleRecord(overrides: Partial<QuoteRecord> = {}): QuoteRecord {
  return {
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
    lineItemsJson: [{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }],
    subtotal: decimal('20.00'),
    depositAmount: decimal('6.00'),
    balanceAmount: decimal('14.00'),
    total: decimal('20.00'),
    status: 'SENT',
    validUntil: new Date('2026-12-01T00:00:00.000Z'),
    estimatedDelayDays: 30,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('QuoteMapper.toDomain', () => {
  it('parses lineItemsJson into typed line items', () => {
    const entity = QuoteMapper.toDomain(sampleRecord());
    expect(entity.lineItems).toEqual([{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }]);
  });

  it('converts Decimal fields to decimal strings', () => {
    const entity = QuoteMapper.toDomain(sampleRecord());
    expect(entity.subtotal).toBe('20.00');
    expect(entity.total).toBe('20.00');
  });

  it('falls back to an empty array when lineItemsJson is not an array', () => {
    const entity = QuoteMapper.toDomain(sampleRecord({ lineItemsJson: null, subtotal: decimal('0.00') }));
    expect(entity.lineItems).toEqual([]);
  });
});

describe('QuoteMapper.toResponseDto', () => {
  it('maps every field, including ISO date formatting', () => {
    const entity = QuoteMapper.toDomain(sampleRecord());
    const dto = QuoteMapper.toResponseDto(entity);

    expect(dto.quoteNumber).toBe('ANG-DEV-2026-abc12345');
    expect(dto.lineItems).toEqual([{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }]);
    expect(dto.validUntil).toBe('2026-12-01T00:00:00.000Z');
    expect(dto.estimatedDelayDays).toBe(30);
  });

  it('maps a null validUntil to null', () => {
    const entity = QuoteMapper.toDomain(sampleRecord({ validUntil: null }));
    expect(QuoteMapper.toResponseDto(entity).validUntil).toBeNull();
  });
});
