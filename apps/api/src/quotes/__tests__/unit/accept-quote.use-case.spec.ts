import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { AcceptQuoteUseCase } from '../../application/use-cases/accept-quote.use-case';

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
    status: 'SENT',
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
    update: jest.fn().mockResolvedValue(QuoteEntity.create(buildProps({ status: 'ACCEPTED' }))),
  };
}

describe('AcceptQuoteUseCase', () => {
  it('throws NotFoundException for an unknown quoteNumber', async () => {
    const useCase = new AcceptQuoteUseCase(buildCustomerRepository(), buildRepository(null));

    await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the quote belongs to another customer', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new AcceptQuoteUseCase(buildCustomerRepository(sampleCustomer('customer-2', 'user-2')), repository);

    await expect(useCase.execute('ANG-DEV-2026-abc12345', 'user-2')).rejects.toThrow(ForbiddenException);
  });

  it.each(['DRAFT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const)(
    'rejects accepting a %s quote',
    async (status) => {
      const repository = buildRepository(QuoteEntity.create(buildProps({ status })));
      const useCase = new AcceptQuoteUseCase(buildCustomerRepository(), repository);

      await expect(useCase.execute('ANG-DEV-2026-abc12345', 'user-1')).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it.each(['SENT', 'VIEWED'] as const)('accepts a %s quote owned by the caller', async (status) => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status })));
    const useCase = new AcceptQuoteUseCase(buildCustomerRepository(), repository);

    await useCase.execute('ANG-DEV-2026-abc12345', 'user-1');

    expect(repository.update).toHaveBeenCalledWith('quote-1', { status: 'ACCEPTED' });
  });
});
