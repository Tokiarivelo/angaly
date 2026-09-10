import { Inject, Injectable } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { generateQuoteNumber } from '../../domain/value-objects/quote-number.vo';
import { resolveCustomerId } from '../lib/resolve-customer-id';

export interface CreateQuoteFromSurMesureRequestCommand {
  userId: string;
  garmentType: string;
  occasion: string | null;
  eventDate: Date | null;
  budgetRange: string | null;
  fabricPreference: string | null;
  message: string | null;
  inspirationMediaIds: string[];
}

/** `description` is the staff-facing brief — see quote.entity.ts for why lineItemsJson stays pricing-only. */
function formatDescription(command: CreateQuoteFromSurMesureRequestCommand): string {
  const lines = [`Demande sur mesure — ${command.garmentType}`];
  if (command.occasion) lines.push(`Occasion : ${command.occasion}`);
  if (command.eventDate) lines.push(`Date de l'événement : ${command.eventDate.toISOString().slice(0, 10)}`);
  if (command.budgetRange) lines.push(`Budget indicatif : ${command.budgetRange}`);
  if (command.fabricPreference) lines.push(`Tissu souhaité : ${command.fabricPreference}`);
  if (command.message) lines.push(`Message : ${command.message}`);
  if (command.inspirationMediaIds.length > 0) {
    lines.push(`Photos d'inspiration : ${command.inspirationMediaIds.join(', ')}`);
  }
  return lines.join('\n');
}

/** Intake for `demande-sur-mesure` (3-step form submitted as one call) — see docs/features/quotes.md. */
@Injectable()
export class CreateQuoteFromSurMesureRequestUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(command: CreateQuoteFromSurMesureRequestCommand): Promise<QuoteEntity> {
    const customerId = await resolveCustomerId(this.customerRepository, command.userId);
    return this.quoteRepository.create({
      quoteNumber: generateQuoteNumber(),
      customerId,
      creationId: null,
      description: formatDescription(command),
    });
  }
}
