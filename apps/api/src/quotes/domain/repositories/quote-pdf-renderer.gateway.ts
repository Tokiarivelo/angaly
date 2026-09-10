import type { QuoteEntity } from '../entities/quote.entity';

export const QUOTE_PDF_RENDERER = Symbol('IQuotePdfRenderer');

/**
 * Port for PDF rendering. Kept in the Domain layer so the Application layer
 * never imports Infrastructure types directly (.cursor/rules/003-nestjs-clean-arch.mdc).
 * Implemented by infrastructure/services/quote-pdf.service.ts.
 */
export interface IQuotePdfRenderer {
  render: (quote: QuoteEntity) => Promise<Buffer>;
}
