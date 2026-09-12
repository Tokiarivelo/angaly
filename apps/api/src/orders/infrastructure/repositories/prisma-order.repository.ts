import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        currency: order.currency,
        shippingAddressJson: order.shippingAddressJson || undefined,
        items: {
          create: order.items.map((item) => ({
            id: item.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return null;
    return OrderMapper.toDomain(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return null;
    return OrderMapper.toDomain(order);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(OrderMapper.toDomain);
  }

  async update(order: Order): Promise<void> {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: order.status,
        // Typically, we only update status after creation, but we could add more if needed
      },
    });
  }
}
