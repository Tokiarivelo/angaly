import { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@angaly/database';
import { OrderStatus } from '@angaly/types';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

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
    ) || [];

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
}
