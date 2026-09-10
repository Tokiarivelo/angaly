import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { SendQuoteUseCase } from '../../application/use-cases/send-quote.use-case';

function buildProps(overrides: Partial<QuoteProps> = {}): QuoteProps {
  return {
    id: 'quote-1',
    quoteNumber: 'ANG-DEV-2026-abc12345',
    customerId: 'customer-1',
    creationId: null,
    description: 'Demande sur mesure — Robe de mariée',
    lineItems: [],
    subtotal: '0.00',
    depositAmount: '0.00',
    balanceAmount: '0.00',
    total: '0.00',
    status: 'DRAFT',
    validUntil: null,
    estimatedDelayDays: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildRepository(quote: QuoteEntity | null): jest.Mocked<IQuoteRepository> {
  return {
    findByQuoteNumber: jest.fn().mockResolvedValue(quote),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockImplementation((_id, changes) => Promise.resolve(QuoteEntity.create(buildProps(changes as Partial<QuoteProps>)))),
  };
}

describe('SendQuoteUseCase', () => {
  it('throws NotFoundException for an unknown quoteNumber', async () => {
    const useCase = new SendQuoteUseCase(buildRepository(null));

    await expect(
      useCase.execute({
        quoteNumber: 'missing',
        lineItems: [],
        depositAmount: '0.00',
        total: '0.00',
        validUntil: null,
        estimatedDelayDays: null,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when the quote is not DRAFT', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status: 'SENT' })));
    const useCase = new SendQuoteUseCase(repository);

    await expect(
      useCase.execute({
        quoteNumber: 'ANG-DEV-2026-abc12345',
        lineItems: [{ label: 'Tissu', quantity: 1, unitPrice: '100.00' }],
        depositAmount: '30.00',
        total: '100.00',
        validUntil: null,
        estimatedDelayDays: null,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws BadRequestException when depositAmount exceeds total', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new SendQuoteUseCase(repository);

    await expect(
      useCase.execute({
        quoteNumber: 'ANG-DEV-2026-abc12345',
        lineItems: [{ label: 'Tissu', quantity: 1, unitPrice: '100.00' }],
        depositAmount: '150.00',
        total: '100.00',
        validUntil: null,
        estimatedDelayDays: null,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('prices a DRAFT quote and transitions it to SENT', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new SendQuoteUseCase(repository);

    await useCase.execute({
      quoteNumber: 'ANG-DEV-2026-abc12345',
      lineItems: [
        { label: 'Tissu satin', quantity: 3, unitPrice: '20.00' },
        { label: 'Confection', quantity: 1, unitPrice: '140.00' },
      ],
      depositAmount: '60.00',
      total: '200.00',
      validUntil: new Date('2026-12-01T00:00:00.000Z'),
      estimatedDelayDays: 30,
    });

    const [id, changes] = repository.update.mock.calls[0];
    expect(id).toBe('quote-1');
    expect(changes.subtotal).toBe('200.00');
    expect(changes.balanceAmount).toBe('140.00');
    expect(changes.status).toBe('SENT');
  });
});
