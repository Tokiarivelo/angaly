import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { QuoteEntity, QuoteLineItem } from '../../domain/entities/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../../domain/repositories/quote.repository';
import { canTransitionQuoteStatus } from '../../domain/value-objects/quote-status-transition.vo';

export interface SendQuoteCommand {
  quoteNumber: string;
  lineItems: QuoteLineItem[];
  /** Decimal strings — see quote.entity.ts "Money fields". */
  depositAmount: string;
  total: string;
  validUntil: Date | null;
  estimatedDelayDays: number | null;
}

/** Staff pricing action, `DRAFT` -> `SENT` (see docs/features/quotes.md). */
@Injectable()
export class SendQuoteUseCase {
  constructor(@Inject(QUOTE_REPOSITORY) private readonly quoteRepository: IQuoteRepository) {}

  async execute(command: SendQuoteCommand): Promise<QuoteEntity> {
    const quote = await this.quoteRepository.findByQuoteNumber(command.quoteNumber);
    if (!quote) {
      throw new NotFoundException(`Quote "${command.quoteNumber}" not found`);
    }
    if (!canTransitionQuoteStatus(quote.status, 'SENT')) {
      throw new ConflictException(`Cannot send a quote with status "${quote.status}"`);
    }
    const depositAmount = Number(command.depositAmount);
    const total = Number(command.total);
    if (depositAmount > total) {
      throw new BadRequestException('depositAmount cannot exceed total');
    }

    const subtotal = command.lineItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
    const balanceAmount = total - depositAmount;

    return this.quoteRepository.update(quote.id, {
      lineItems: command.lineItems,
      subtotal: subtotal.toFixed(2),
      depositAmount: depositAmount.toFixed(2),
      balanceAmount: balanceAmount.toFixed(2),
      total: total.toFixed(2),
      status: 'SENT',
      validUntil: command.validUntil,
      estimatedDelayDays: command.estimatedDelayDays,
    });
  }
}
