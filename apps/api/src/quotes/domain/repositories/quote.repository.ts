import type { QuoteEntity, QuoteLineItem } from '../entities/quote.entity';
import type { QuoteStatus } from '../value-objects/quote-status-transition.vo';

export const QUOTE_REPOSITORY = Symbol('IQuoteRepository');

export interface CreateQuoteInput {
  quoteNumber: string;
  customerId: string;
  creationId: string | null;
  description: string;
}

export interface UpdateQuoteInput {
  description?: string;
  lineItems?: QuoteLineItem[];
  subtotal?: string;
  depositAmount?: string;
  balanceAmount?: string;
  total?: string;
  status?: QuoteStatus;
  validUntil?: Date | null;
  estimatedDelayDays?: number | null;
}

export interface IQuoteRepository {
  findByQuoteNumber: (quoteNumber: string) => Promise<QuoteEntity | null>;
  findById: (id: string) => Promise<QuoteEntity | null>;
  /** Created as `status: DRAFT`, empty `lineItems`, every amount at 0. */
  create: (input: CreateQuoteInput) => Promise<QuoteEntity>;
  update: (id: string, changes: UpdateQuoteInput) => Promise<QuoteEntity>;
}
