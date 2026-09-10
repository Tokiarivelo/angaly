import { NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import type { ICreationRepository } from '../../../creations/domain/repositories/creation.repository';
import type { CreationEntity } from '../../../creations/domain/entities/creation.entity';
import { CreateQuoteFromDesignBriefUseCase } from '../../application/use-cases/create-quote-from-design-brief.use-case';

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
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

function sampleQuote(): QuoteEntity {
  return QuoteEntity.create({
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
  });
}

function buildQuoteRepository(): jest.Mocked<IQuoteRepository> {
  return {
    findByQuoteNumber: jest.fn(),
    findById: jest.fn(),
    create: jest.fn().mockResolvedValue(sampleQuote()),
    update: jest.fn(),
  };
}

function buildCreationRepository(creation: CreationEntity | null): jest.Mocked<ICreationRepository> {
  return {
    findBySlug: jest.fn(),
    findById: jest.fn().mockResolvedValue(creation),
    list: jest.fn(),
  };
}

describe('CreateQuoteFromDesignBriefUseCase', () => {
  it('throws NotFoundException when the base Creation does not exist', async () => {
    const useCase = new CreateQuoteFromDesignBriefUseCase(
      buildCustomerRepository(),
      buildCreationRepository(null),
      buildQuoteRepository(),
    );

    await expect(
      useCase.execute({ userId: 'user-1', creationId: 'missing', options: {}, notes: null, inspirationMediaIds: [] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a DRAFT quote referencing the base Creation', async () => {
    const quoteRepository = buildQuoteRepository();
    const useCase = new CreateQuoteFromDesignBriefUseCase(
      buildCustomerRepository(),
      buildCreationRepository({ id: 'creation-1' } as CreationEntity),
      quoteRepository,
    );

    await useCase.execute({
      userId: 'user-1',
      creationId: 'creation-1',
      options: { tissu: 'soie', couleur: 'ivoire' },
      notes: 'Ceinture ajustable',
      inspirationMediaIds: ['media-1'],
    });

    const input = quoteRepository.create.mock.calls[0][0];
    expect(input.creationId).toBe('creation-1');
    expect(input.customerId).toBe('customer-1');
    expect(input.description).toContain('tissu : soie');
    expect(input.description).toContain('Ceinture ajustable');
  });
});
