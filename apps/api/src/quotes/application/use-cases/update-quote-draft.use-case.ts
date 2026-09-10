import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

export interface UpdateQuoteDraftCommand {
  quoteId: string;
  userId: string;
  options: Record<string, string> | null;
  notes: string | null;
  inspirationMediaIds: string[] | null;
}

function formatDescription(existing: string, command: UpdateQuoteDraftCommand): string {
  const lines = [existing];
  if (command.options) {
    lines.push(...Object.entries(command.options).map(([key, value]) => `${key} : ${value}`));
  }
  if (command.notes) lines.push(`Notes : ${command.notes}`);
  if (command.inspirationMediaIds && command.inspirationMediaIds.length > 0) {
    lines.push(`Photos d'inspiration : ${command.inspirationMediaIds.join(', ')}`);
  }
  return lines.join('\n');
}

/** Incremental save of a design-brief draft — `DRAFT` status only (see docs/features/quotes.md). */
@Injectable()
export class UpdateQuoteDraftUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(command: UpdateQuoteDraftCommand): Promise<QuoteEntity> {
    const customerId = await resolveCustomerId(this.customerRepository, command.userId);
    const quote = await this.quoteRepository.findById(command.quoteId);
    if (!quote) {
      throw new NotFoundException(`Quote "${command.quoteId}" not found`);
    }
    if (quote.customerId !== customerId) {
      throw new ForbiddenException('This quote does not belong to the current user');
    }
    if (quote.status !== 'DRAFT') {
      throw new ConflictException(`Only a DRAFT quote can be edited (current status: "${quote.status}")`);
    }

    return this.quoteRepository.update(quote.id, {
      description: formatDescription(quote.description, command),
    });
  }
}
