import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import { CreateQuoteFromSurMesureRequestUseCase } from '../../application/use-cases/create-quote-from-sur-mesure-request.use-case';

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
  });
}

function buildRepository(): jest.Mocked<IQuoteRepository> {
  return {
    findByQuoteNumber: jest.fn(),
    findById: jest.fn(),
    create: jest.fn().mockResolvedValue(sampleQuote()),
    update: jest.fn(),
  };
}

describe('CreateQuoteFromSurMesureRequestUseCase', () => {
  it('creates a DRAFT quote with no creationId, describing the intake', async () => {
    const repository = buildRepository();
    const useCase = new CreateQuoteFromSurMesureRequestUseCase(buildCustomerRepository(), repository);

    await useCase.execute({
      userId: 'user-1',
      garmentType: 'Robe de mariée',
      occasion: 'Mariage',
      eventDate: new Date('2026-12-01T00:00:00.000Z'),
      budgetRange: '2000-3000 EUR',
      fabricPreference: 'Soie',
      message: 'Manches longues souhaitées',
      inspirationMediaIds: ['media-1', 'media-2'],
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    const input = repository.create.mock.calls[0][0];
    expect(input.customerId).toBe('customer-1');
    expect(input.creationId).toBeNull();
    expect(input.description).toContain('Robe de mariée');
    expect(input.description).toContain('Mariage');
    expect(input.description).toContain('Soie');
    expect(input.description).toContain('media-1, media-2');
    expect(input.quoteNumber).toMatch(/^ANG-DEV-\d{4}-/);
  });

  it('omits optional fields from the description when absent', async () => {
    const repository = buildRepository();
    const useCase = new CreateQuoteFromSurMesureRequestUseCase(buildCustomerRepository(), repository);

    await useCase.execute({
      userId: 'user-1',
      garmentType: 'Costume',
      occasion: null,
      eventDate: null,
      budgetRange: null,
      fabricPreference: null,
      message: null,
      inspirationMediaIds: [],
    });

    const input = repository.create.mock.calls[0][0];
    expect(input.description).toBe('Demande sur mesure — Costume');
  });
});
