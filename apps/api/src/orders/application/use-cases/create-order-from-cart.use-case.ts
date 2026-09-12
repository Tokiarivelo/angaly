import { Injectable, BadRequestException } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderStatus } from '@angaly/types';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface CreateOrderCommand {
  customerId: string;
  items: {
    productVariantId: string;
    quantity: number;
  }[];
  shippingAddressJson?: any;
}

@Injectable()
export class CreateOrderFromCartUseCase {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    if (!command.items || command.items.length === 0) {
      throw new BadRequestException('Cannot create an order with no items');
    }

    // 1. Resolve variants and check inventory in a transaction
    return this.prisma.$transaction(async (tx: any) => {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];
      const orderId = randomUUID();

      for (const itemCommand of command.items) {
        // Fetch variant + inventory (locking would be ideal if supported, e.g. raw query FOR UPDATE)
        const variant = await tx.productVariant.findUnique({
          where: { id: itemCommand.productVariantId },
          include: { inventory: true },
        });

        if (!variant) {
          throw new BadRequestException(`Variant ${itemCommand.productVariantId} not found`);
        }

        if (!variant.inventory) {
          throw new BadRequestException(`Inventory missing for variant ${itemCommand.productVariantId}`);
        }

        if (variant.inventory.quantityAvailable < itemCommand.quantity) {
          throw new BadRequestException(
            `Not enough stock for variant ${itemCommand.productVariantId}. Available: ${variant.inventory.quantityAvailable}, Requested: ${itemCommand.quantity}`,
          );
        }

        // Decrement inventory
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: {
            quantityAvailable: {
              decrement: itemCommand.quantity,
            },
          },
        });

        const unitPrice = Number(variant.price);
        subtotal += unitPrice * itemCommand.quantity;

        orderItems.push(
          new OrderItem(
            randomUUID(),
            orderId,
            itemCommand.productVariantId,
            itemCommand.quantity,
            unitPrice,
          ),
        );
      }

      const shippingCost = 0; // Simple rule for now
      const total = subtotal + shippingCost;
      const orderNumber = this.generateOrderNumber();
      const now = new Date();

      const order = new Order(
        orderId,
        orderNumber,
        command.customerId,
        OrderStatus.PENDING,
        subtotal,
        shippingCost,
        total,
        'MGA',
        command.shippingAddressJson || null,
        now,
        now,
        orderItems,
      );

      // Create order via repository logic, passing tx would be better for clean arch, 
      // but since the repo uses this.prisma, we either pass tx to the repo method or do it directly here.
      // To respect the repository abstraction but ensure transaction safety:
      await tx.order.create({
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

      return order;
    });
  }

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ANG-${year}-${random}`;
  }
}
