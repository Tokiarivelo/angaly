import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CREATION_REPOSITORY, ICreationRepository } from '../../../creations/domain/repositories/creation.repository';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { generateQuoteNumber } from '../../domain/value-objects/quote-number.vo';
import { resolveCustomerId } from '../lib/resolve-customer-id';

export interface CreateQuoteFromDesignBriefCommand {
  userId: string;
  creationId: string;
  options: Record<string, string>;
  notes: string | null;
  inspirationMediaIds: string[];
}

function formatDescription(command: CreateQuoteFromDesignBriefCommand): string {
  const lines = ['Dossier de conception — personnalisation'];
  const optionEntries = Object.entries(command.options);
  if (optionEntries.length > 0) {
    lines.push(...optionEntries.map(([key, value]) => `${key} : ${value}`));
  }
  if (command.notes) lines.push(`Notes : ${command.notes}`);
  if (command.inspirationMediaIds.length > 0) {
    lines.push(`Photos d'inspiration : ${command.inspirationMediaIds.join(', ')}`);
  }
  return lines.join('\n');
}

/** Intake for `personnalisation-creation` — see docs/features/quotes.md. */
@Injectable()
export class CreateQuoteFromDesignBriefUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(CREATION_REPOSITORY) private readonly creationRepository: ICreationRepository,
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(command: CreateQuoteFromDesignBriefCommand): Promise<QuoteEntity> {
    const customerId = await resolveCustomerId(this.customerRepository, command.userId);
    const creation = await this.creationRepository.findById(command.creationId);
    if (!creation) {
      throw new NotFoundException(`Creation "${command.creationId}" not found`);
    }

    return this.quoteRepository.create({
      quoteNumber: generateQuoteNumber(),
      customerId,
      creationId: command.creationId,
      description: formatDescription(command),
    });
  }
}
