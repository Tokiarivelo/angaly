import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { UpdateQuoteDraftUseCase } from '../../application/use-cases/update-quote-draft.use-case';

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
    creationId: 'creation-1',
    description: 'Dossier de conception — personnalisation',
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
    findByQuoteNumber: jest.fn(),
    findById: jest.fn().mockResolvedValue(quote),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(QuoteEntity.create(buildProps({ status: 'DRAFT' }))),
  };
}

describe('UpdateQuoteDraftUseCase', () => {
  it('throws NotFoundException for an unknown quote id', async () => {
    const useCase = new UpdateQuoteDraftUseCase(buildCustomerRepository(), buildRepository(null));

    await expect(
      useCase.execute({ quoteId: 'missing', userId: 'user-1', options: null, notes: null, inspirationMediaIds: null }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the quote belongs to another customer', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new UpdateQuoteDraftUseCase(buildCustomerRepository(sampleCustomer('customer-2', 'user-2')), repository);

    await expect(
      useCase.execute({ quoteId: 'quote-1', userId: 'user-2', options: null, notes: null, inspirationMediaIds: null }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ConflictException when the quote is no longer DRAFT', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps({ status: 'SENT' })));
    const useCase = new UpdateQuoteDraftUseCase(buildCustomerRepository(), repository);

    await expect(
      useCase.execute({ quoteId: 'quote-1', userId: 'user-1', options: null, notes: null, inspirationMediaIds: null }),
    ).rejects.toThrow(ConflictException);
  });

  it('appends notes/options/media to the description of a DRAFT quote it owns', async () => {
    const repository = buildRepository(QuoteEntity.create(buildProps()));
    const useCase = new UpdateQuoteDraftUseCase(buildCustomerRepository(), repository);

    await useCase.execute({
      quoteId: 'quote-1',
      userId: 'user-1',
      options: { couleur: 'ivoire' },
      notes: 'Ajouter une traîne',
      inspirationMediaIds: ['media-2'],
    });

    const [id, changes] = repository.update.mock.calls[0];
    expect(id).toBe('quote-1');
    expect(changes.description).toContain('couleur : ivoire');
    expect(changes.description).toContain('Ajouter une traîne');
    expect(changes.description).toContain('media-2');
  });
});
