import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { QuoteProps } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { IQuoteRepository } from '../../domain/repositories/quote.repository';
import type { IQuotePdfRenderer } from '../../domain/repositories/quote-pdf-renderer.gateway';
import type { UploadMediaBufferUseCase } from '../../../media/application/use-cases/upload-media-buffer.use-case';
import { ExportQuotePdfUseCase } from '../../application/use-cases/export-quote-pdf.use-case';

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

function buildQuoteRepository(quote: QuoteEntity | null): jest.Mocked<IQuoteRepository> {
  return {
    findByQuoteNumber: jest.fn().mockResolvedValue(quote),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

function buildRenderer(): jest.Mocked<IQuotePdfRenderer> {
  return { render: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')) };
}

function buildUploadUseCase(): jest.Mocked<Pick<UploadMediaBufferUseCase, 'execute'>> {
  return { execute: jest.fn().mockResolvedValue({ url: 'http://minio.local/quotes/devis.pdf' }) };
}

describe('ExportQuotePdfUseCase', () => {
  it('throws NotFoundException for an unknown quoteNumber', async () => {
    const useCase = new ExportQuotePdfUseCase(
      buildCustomerRepository(),
      buildQuoteRepository(null),
      buildRenderer(),
      buildUploadUseCase() as unknown as UploadMediaBufferUseCase,
    );

    await expect(useCase.execute('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the quote belongs to another customer', async () => {
    const useCase = new ExportQuotePdfUseCase(
      buildCustomerRepository(sampleCustomer('customer-2', 'user-2')),
      buildQuoteRepository(QuoteEntity.create(buildProps())),
      buildRenderer(),
      buildUploadUseCase() as unknown as UploadMediaBufferUseCase,
    );

    await expect(useCase.execute('ANG-DEV-2026-abc12345', 'user-2')).rejects.toThrow(ForbiddenException);
  });

  it('renders the quote and uploads it via media, returning the public URL', async () => {
    const renderer = buildRenderer();
    const uploadUseCase = buildUploadUseCase();
    const useCase = new ExportQuotePdfUseCase(
      buildCustomerRepository(),
      buildQuoteRepository(QuoteEntity.create(buildProps())),
      renderer,
      uploadUseCase as unknown as UploadMediaBufferUseCase,
    );

    const url = await useCase.execute('ANG-DEV-2026-abc12345', 'user-1');

    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(uploadUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'QUOTE_DOCUMENT', entityId: 'quote-1', mimeType: 'application/pdf' }),
    );
    expect(url).toBe('http://minio.local/quotes/devis.pdf');
  });
});
