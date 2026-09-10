import { PrismaQuoteRepository } from '../../infrastructure/repositories/prisma-quote.repository';
import type { QuoteRecord } from '../../infrastructure/repositories/prisma-quote.repository';
import type { CreateQuoteInput } from '../../domain/repositories/quote.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockQuoteDelegate {
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}

function decimal(value: string): QuoteRecord['subtotal'] {
  return { toString: () => value } as QuoteRecord['subtotal'];
}

function buildPrismaServiceMock(): { prisma: PrismaService; quote: MockQuoteDelegate } {
  const quote: MockQuoteDelegate = { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() };
  const prisma = { quote } as unknown as PrismaService;
  return { prisma, quote };
}

function sampleRecord(overrides: Partial<QuoteRecord> = {}): QuoteRecord {
  return {
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
    lineItemsJson: [],
    subtotal: decimal('0.00'),
    depositAmount: decimal('0.00'),
    balanceAmount: decimal('0.00'),
    total: decimal('0.00'),
    status: 'DRAFT',
    validUntil: null,
    estimatedDelayDays: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function sampleInput(): CreateQuoteInput {
  return {
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
  };
}

describe('PrismaQuoteRepository', () => {
  it('findByQuoteNumber() returns null when no row matches', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.findUnique.mockResolvedValue(null);
    const repository = new PrismaQuoteRepository(prisma);

    expect(await repository.findByQuoteNumber('missing')).toBeNull();
  });

  it('findByQuoteNumber() maps the row to a domain entity when found', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaQuoteRepository(prisma);

    const result = await repository.findByQuoteNumber('ANG-DEV-2026-abc12345');

    expect(result?.id).toBe('quote-1');
    expect(result?.subtotal).toBe('0.00');
  });

  it('findById() maps the row to a domain entity when found', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.findUnique.mockResolvedValue(sampleRecord());
    const repository = new PrismaQuoteRepository(prisma);

    expect((await repository.findById('quote-1'))?.id).toBe('quote-1');
  });

  it('create() persists a fresh DRAFT with zeroed amounts and empty line items', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.create.mockResolvedValue(sampleRecord());
    const repository = new PrismaQuoteRepository(prisma);

    const result = await repository.create(sampleInput());

    const call = quote.create.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data.quoteNumber).toBe('ANG-DEV-2026-abc12345');
    expect(call[0].data.lineItemsJson).toEqual([]);
    expect(call[0].data.subtotal).toBe('0.00');
    expect(result.id).toBe('quote-1');
  });

  it('update() only sets the fields provided', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.update.mockResolvedValue(sampleRecord({ status: 'VIEWED' }));
    const repository = new PrismaQuoteRepository(prisma);

    await repository.update('quote-1', { status: 'VIEWED' });

    expect(quote.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'quote-1' }, data: { status: 'VIEWED' } }),
    );
  });

  it('update() serializes lineItems back into lineItemsJson', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.update.mockResolvedValue(sampleRecord());
    const repository = new PrismaQuoteRepository(prisma);

    await repository.update('quote-1', {
      lineItems: [{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }],
      subtotal: '20.00',
    });

    const call = quote.update.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data.lineItemsJson).toEqual([{ label: 'Tissu', quantity: 2, unitPrice: '10.00' }]);
    expect(call[0].data.subtotal).toBe('20.00');
  });

  it('update() sets every field at once when all are provided (send-quote pricing)', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.update.mockResolvedValue(sampleRecord({ status: 'SENT' }));
    const repository = new PrismaQuoteRepository(prisma);
    const validUntil = new Date('2026-12-01T00:00:00.000Z');

    await repository.update('quote-1', {
      description: 'Updated description',
      lineItems: [{ label: 'Tissu', quantity: 1, unitPrice: '100.00' }],
      subtotal: '100.00',
      depositAmount: '30.00',
      balanceAmount: '70.00',
      total: '100.00',
      status: 'SENT',
      validUntil,
      estimatedDelayDays: 30,
    });

    const call = quote.update.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data).toEqual({
      description: 'Updated description',
      lineItemsJson: [{ label: 'Tissu', quantity: 1, unitPrice: '100.00' }],
      subtotal: '100.00',
      depositAmount: '30.00',
      balanceAmount: '70.00',
      total: '100.00',
      status: 'SENT',
      validUntil,
      estimatedDelayDays: 30,
    });
  });

  it('update() clears validUntil when explicitly set to null', async () => {
    const { prisma, quote } = buildPrismaServiceMock();
    quote.update.mockResolvedValue(sampleRecord());
    const repository = new PrismaQuoteRepository(prisma);

    await repository.update('quote-1', { validUntil: null, estimatedDelayDays: null });

    const call = quote.update.mock.calls[0] as [{ data: Record<string, unknown> }];
    expect(call[0].data).toEqual({ validUntil: null, estimatedDelayDays: null });
  });
});
