import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@angaly/database';
import type { OrderStatus } from '@angaly/types';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderItemResponseDto, OrderResponseDto } from '../../application/dtos/order-response.dto';

type PrismaOrderWithItems = PrismaOrder & { items?: PrismaOrderItem[] };

export class OrderMapper {
  static toDomain(prismaOrder: PrismaOrderWithItems): Order {
    const items = prismaOrder.items?.map(
      (item) =>
        new OrderItem(
          item.id,
          item.orderId,
          item.productVariantId,
          item.quantity,
          Number(item.unitPrice),
        )
    ) ?? [];

    return new Order(
      prismaOrder.id,
      prismaOrder.orderNumber,
      prismaOrder.customerId,
      prismaOrder.status as OrderStatus,
      Number(prismaOrder.subtotal),
      Number(prismaOrder.shippingCost),
      Number(prismaOrder.total),
      prismaOrder.currency,
      prismaOrder.shippingAddressJson,
      prismaOrder.createdAt,
      prismaOrder.updatedAt,
      items,
    );
  }

  static toResponseDto(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.customerId = order.customerId;
    dto.status = order.status;
    dto.subtotal = order.subtotal.toFixed(2);
    dto.shippingCost = order.shippingCost.toFixed(2);
    dto.total = order.total.toFixed(2);
    dto.currency = order.currency;
    dto.shippingAddressJson = order.shippingAddressJson;
    dto.items = order.items.map((item) => {
      const itemDto = new OrderItemResponseDto();
      itemDto.id = item.id;
      itemDto.orderId = item.orderId;
      itemDto.productVariantId = item.productVariantId;
      itemDto.quantity = item.quantity;
      itemDto.unitPrice = item.unitPrice.toFixed(2);
      return itemDto;
    });
    dto.createdAt = order.createdAt.toISOString();
    dto.updatedAt = order.updatedAt.toISOString();
    return dto;
  }
}
