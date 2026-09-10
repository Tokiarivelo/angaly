import { QuoteLineItemResponseDto, QuoteResponseDto } from '../../application/dtos/quote-response.dto';
import type { QuoteLineItem } from '../../domain/entities/quote.entity';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type { QuoteStatus as SharedQuoteStatus } from '@angaly/types';
import type { QuoteRecord } from '../repositories/prisma-quote.repository';

function parseLineItems(json: unknown): QuoteLineItem[] {
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      label: String(record.label),
      quantity: Number(record.quantity),
      unitPrice: String(record.unitPrice),
    };
  });
}

export class QuoteMapper {
  static toDomain(record: QuoteRecord): QuoteEntity {
    return QuoteEntity.create({
      id: record.id,
      quoteNumber: record.quoteNumber,
      customerId: record.customerId,
      creationId: record.creationId,
      description: record.description,
      lineItems: parseLineItems(record.lineItemsJson),
      subtotal: record.subtotal.toString(),
      depositAmount: record.depositAmount.toString(),
      balanceAmount: record.balanceAmount.toString(),
      total: record.total.toString(),
      status: record.status,
      validUntil: record.validUntil,
      estimatedDelayDays: record.estimatedDelayDays,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: QuoteEntity): QuoteResponseDto {
    const dto = new QuoteResponseDto();
    dto.id = entity.id;
    dto.quoteNumber = entity.quoteNumber;
    dto.customerId = entity.customerId;
    dto.creationId = entity.creationId;
    dto.description = entity.description;
    dto.lineItems = entity.lineItems.map((item) => {
      const lineItemDto = new QuoteLineItemResponseDto();
      lineItemDto.label = item.label;
      lineItemDto.quantity = item.quantity;
      lineItemDto.unitPrice = item.unitPrice;
      return lineItemDto;
    });
    dto.subtotal = entity.subtotal;
    dto.depositAmount = entity.depositAmount;
    dto.balanceAmount = entity.balanceAmount;
    dto.total = entity.total;
    dto.status = entity.status as SharedQuoteStatus;
    dto.validUntil = entity.validUntil ? entity.validUntil.toISOString() : null;
    dto.estimatedDelayDays = entity.estimatedDelayDays;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
