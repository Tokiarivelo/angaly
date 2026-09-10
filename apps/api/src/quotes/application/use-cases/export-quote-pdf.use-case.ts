import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { UploadMediaBufferUseCase } from '../../../media/application/use-cases/upload-media-buffer.use-case';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { IQuotePdfRenderer, QUOTE_PDF_RENDERER } from '../../domain/repositories/quote-pdf-renderer.gateway';
import { resolveCustomerId } from '../lib/resolve-customer-id';

/** Renders the quote to PDF and uploads it via `media` (never stored in `Quote` — see docs/features/quotes.md). */
@Injectable()
export class ExportQuotePdfUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
    @Inject(QUOTE_PDF_RENDERER) private readonly quotePdfRenderer: IQuotePdfRenderer,
    private readonly uploadMediaBufferUseCase: UploadMediaBufferUseCase,
  ) {}

  async execute(quoteNumber: string, userId: string): Promise<string> {
    const customerId = await resolveCustomerId(this.customerRepository, userId);
    const quote = await this.quoteRepository.findByQuoteNumber(quoteNumber);
    if (!quote) {
      throw new NotFoundException(`Quote "${quoteNumber}" not found`);
    }
    if (quote.customerId !== customerId) {
      throw new ForbiddenException('This quote does not belong to the current user');
    }

    const pdfBuffer = await this.quotePdfRenderer.render(quote);
    const media = await this.uploadMediaBufferUseCase.execute({
      entityType: 'QUOTE_DOCUMENT',
      entityId: quote.id,
      altText: `Devis ${quote.quoteNumber}`,
      originalFilename: `${quote.quoteNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    return media.url;
  }
}
