import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { QuoteEntity, QuoteLineItem } from '../../domain/entities/quote.entity';
import { CreateQuoteInput, IQuoteRepository, UpdateQuoteInput } from '../../domain/repositories/quote.repository';
import { QuoteMapper } from '../mappers/quote.mapper';

export const QUOTE_SELECT = {
  id: true,
  quoteNumber: true,
  customerId: true,
  creationId: true,
  description: true,
  lineItemsJson: true,
  subtotal: true,
  depositAmount: true,
  balanceAmount: true,
  total: true,
  status: true,
  validUntil: true,
  estimatedDelayDays: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.QuoteSelect;

export type QuoteRecord = Prisma.QuoteGetPayload<{ select: typeof QUOTE_SELECT }>;

function toJsonLineItems(lineItems: QuoteLineItem[]): Prisma.InputJsonValue {
  return lineItems.map((item) => ({ label: item.label, quantity: item.quantity, unitPrice: item.unitPrice }));
}

@Injectable()
export class PrismaQuoteRepository implements IQuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByQuoteNumber(quoteNumber: string): Promise<QuoteEntity | null> {
    const record = await this.prisma.quote.findUnique({ where: { quoteNumber }, select: QUOTE_SELECT });
    return record ? QuoteMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<QuoteEntity | null> {
    const record = await this.prisma.quote.findUnique({ where: { id }, select: QUOTE_SELECT });
    return record ? QuoteMapper.toDomain(record) : null;
  }

  async create(input: CreateQuoteInput): Promise<QuoteEntity> {
    const record = await this.prisma.quote.create({
      data: {
        quoteNumber: input.quoteNumber,
        customerId: input.customerId,
        creationId: input.creationId,
        description: input.description,
        lineItemsJson: [],
        subtotal: '0.00',
        depositAmount: '0.00',
        balanceAmount: '0.00',
        total: '0.00',
      },
      select: QUOTE_SELECT,
    });
    return QuoteMapper.toDomain(record);
  }

  async update(id: string, changes: UpdateQuoteInput): Promise<QuoteEntity> {
    const record = await this.prisma.quote.update({
      where: { id },
      data: {
        ...(changes.description !== undefined && { description: changes.description }),
        ...(changes.lineItems !== undefined && { lineItemsJson: toJsonLineItems(changes.lineItems) }),
        ...(changes.subtotal !== undefined && { subtotal: changes.subtotal }),
        ...(changes.depositAmount !== undefined && { depositAmount: changes.depositAmount }),
        ...(changes.balanceAmount !== undefined && { balanceAmount: changes.balanceAmount }),
        ...(changes.total !== undefined && { total: changes.total }),
        ...(changes.status !== undefined && { status: changes.status }),
        ...(changes.validUntil !== undefined && { validUntil: changes.validUntil }),
        ...(changes.estimatedDelayDays !== undefined && { estimatedDelayDays: changes.estimatedDelayDays }),
      },
      select: QUOTE_SELECT,
    });
    return QuoteMapper.toDomain(record);
  }
}
