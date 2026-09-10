import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

const CHANGEABLE_STATUSES = ['SENT', 'VIEWED'];

/**
 * Free-text message to staff — never changes `Quote.status` (no dedicated
 * status exists for "modification requested", see docs/features/quotes.md
 * "Points d'attention"). TODO(notifications, Phase 3): persist/dispatch the
 * message once that module ships — this only validates preconditions today.
 */
@Injectable()
export class RequestQuoteChangeUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(quoteNumber: string, userId: string, _message: string): Promise<void> {
    const customerId = await resolveCustomerId(this.customerRepository, userId);
    const quote = await this.quoteRepository.findByQuoteNumber(quoteNumber);
    if (!quote) {
      throw new NotFoundException(`Quote "${quoteNumber}" not found`);
    }
    if (quote.customerId !== customerId) {
      throw new ForbiddenException('This quote does not belong to the current user');
    }
    if (!CHANGEABLE_STATUSES.includes(quote.status)) {
      throw new ConflictException(`Cannot request a change on a quote with status "${quote.status}"`);
    }
  }
}
