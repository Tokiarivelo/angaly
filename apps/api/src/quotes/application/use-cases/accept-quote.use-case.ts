import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { canTransitionQuoteStatus } from '../../domain/value-objects/quote-status-transition.vo';
import { resolveCustomerId } from '../lib/resolve-customer-id';

@Injectable()
export class AcceptQuoteUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(quoteNumber: string, userId: string): Promise<QuoteEntity> {
    const customerId = await resolveCustomerId(this.customerRepository, userId);
    const quote = await this.quoteRepository.findByQuoteNumber(quoteNumber);
    if (!quote) {
      throw new NotFoundException(`Quote "${quoteNumber}" not found`);
    }
    if (quote.customerId !== customerId) {
      throw new ForbiddenException('This quote does not belong to the current user');
    }
    if (!canTransitionQuoteStatus(quote.status, 'ACCEPTED')) {
      throw new ConflictException(`Cannot accept a quote with status "${quote.status}"`);
    }

    return this.quoteRepository.update(quote.id, { status: 'ACCEPTED' });
  }
}
