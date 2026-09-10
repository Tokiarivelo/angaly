import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuoteByNumberUseCase } from '../../application/use-cases/get-quote-by-number.use-case';

function sampleCustomer(id = 'customer-1', userId = 'user-1'): CustomerEntity {
  return CustomerEntity.create({
    id,
    userId,
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCustomerRepository(customer: CustomerEntity | null = sampleCustomer()): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

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
    update: jest.fn().mockResolvedValue(QuoteEntity.create(buildProps({ status: 'VIEWED' }))),
  };
}

describe('GetQuoteByNumberUseCase', () => {
  it('throws NotFoundException for an unknown quoteNumber', async () => {
    const useCase = new GetQuoteByNumberUseCase(buildCustomerRepository(), buildRepository(null));

    await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the quote belongs to another customer', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new GetQuoteByNumberUseCase(buildCustomerRepository(sampleCustomer('customer-2', 'user-2')), repository);

    await expect(useCase.execute('ANG-DEV-2026-abc12345', 'user-2')).rejects.toThrow(ForbiddenException);
  });

  it('transitions SENT -> VIEWED on first consultation', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status: 'SENT' })));
    const useCase = new GetQuoteByNumberUseCase(buildCustomerRepository(), repository);

    const result = await useCase.execute('ANG-DEV-2026-abc12345', 'user-1');

    expect(repository.update).toHaveBeenCalledWith('quote-1', { status: 'VIEWED' });
    expect(result.status).toBe('VIEWED');
  });

  it('does not re-trigger the transition once already VIEWED', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status: 'VIEWED' })));
    const useCase = new GetQuoteByNumberUseCase(buildCustomerRepository(), repository);

    await useCase.execute('ANG-DEV-2026-abc12345', 'user-1');

    expect(repository.update).not.toHaveBeenCalled();
  });
});
