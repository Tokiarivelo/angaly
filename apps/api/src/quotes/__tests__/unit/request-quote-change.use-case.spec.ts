import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { RequestQuoteChangeUseCase } from '../../application/use-cases/request-quote-change.use-case';

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
    update: jest.fn(),
  };
}

describe('RequestQuoteChangeUseCase', () => {
  it('throws NotFoundException for an unknown quoteNumber', async () => {
    const useCase = new RequestQuoteChangeUseCase(buildCustomerRepository(), buildRepository(null));

    await expect(useCase.execute('missing', 'user-1', 'Please adjust the sleeves')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when the quote belongs to another customer', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new RequestQuoteChangeUseCase(buildCustomerRepository(sampleCustomer('customer-2', 'user-2')), repository);

    await expect(
      useCase.execute('ANG-DEV-2026-abc12345', 'user-2', 'Please adjust the sleeves'),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each(['DRAFT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const)(
    'rejects requesting a change on a %s quote',
    async (status) => {
      const repository = buildRepository(QuoteEntity.create(buildProps({ status })));
      const useCase = new RequestQuoteChangeUseCase(buildCustomerRepository(), repository);

      await expect(
        useCase.execute('ANG-DEV-2026-abc12345', 'user-1', 'Please adjust the sleeves'),
      ).rejects.toThrow(ConflictException);
    },
  );

  it.each(['SENT', 'VIEWED'] as const)('accepts a change request on a %s quote without changing its status', async (status) => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status })));
    const useCase = new RequestQuoteChangeUseCase(buildCustomerRepository(), repository);

    await useCase.execute('ANG-DEV-2026-abc12345', 'user-1', 'Please adjust the sleeves');

    expect(repository.update).not.toHaveBeenCalled();
  });
});
