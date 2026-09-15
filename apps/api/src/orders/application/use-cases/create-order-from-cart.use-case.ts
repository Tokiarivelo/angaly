import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';
import { randomUUID } from 'crypto';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { resolveCustomerId } from '../lib/resolve-customer-id';

export interface CreateOrderCommand {
  userId: string;
  items: {
    productVariantId: string;
    quantity: number;
  }[];
  shippingAddressJson?: unknown;
}

/**
 * Creates an `Order` from cart items, reserving stock as it goes.
 *
 * Writes `Order`/`OrderItem`/`Inventory` directly via `PrismaService` inside
 * a single `$transaction`, bypassing `IOrderRepository` — `IOrderRepository.create()`
 * has no way to join the transaction that also has to touch `Inventory`
 * (same tradeoff `payments`' `confirm-payment.use-case.ts` makes for its own
 * cross-table transaction). Every other `orders` use-case goes through the
 * repository as usual.
 */
@Injectable()
export class CreateOrderFromCartUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    if (!command.items || command.items.length === 0) {
      throw new BadRequestException('Cannot create an order with no items');
    }

    const customerId = await resolveCustomerId(this.customerRepository, command.userId);

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];
      const orderId = randomUUID();

      for (const itemCommand of command.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: itemCommand.productVariantId },
          include: { inventory: true, product: true },
        });

        if (!variant) {
          throw new BadRequestException(`Variant ${itemCommand.productVariantId} not found`);
        }
        if (!variant.inventory) {
          throw new BadRequestException(`Inventory missing for variant ${itemCommand.productVariantId}`);
        }

        // Atomic reservation: the WHERE clause is re-evaluated at UPDATE time under
        // the row lock Postgres takes for the statement, so two concurrent orders
        // racing for the last unit can never both succeed — the loser's `count` is 0.
        const reservation = await tx.inventory.updateMany({
          where: { id: variant.inventory.id, quantityAvailable: { gte: itemCommand.quantity } },
          data: { quantityAvailable: { decrement: itemCommand.quantity } },
        });
        if (reservation.count === 0) {
          throw new BadRequestException(
            `Not enough stock for variant ${itemCommand.productVariantId}. Available: ${variant.inventory.quantityAvailable}, Requested: ${itemCommand.quantity}`,
          );
        }

        const unitPrice = Number(variant.priceOverride ?? variant.product.price);
        subtotal += unitPrice * itemCommand.quantity;

        orderItems.push(new OrderItem(randomUUID(), orderId, itemCommand.productVariantId, itemCommand.quantity, unitPrice));
      }

      const shippingCost = 0; // Simple rule for now
      const total = subtotal + shippingCost;
      const orderNumber = this.generateOrderNumber();
      const now = new Date();

      const order = new Order(
        orderId,
        orderNumber,
        customerId,
        OrderStatus.PENDING,
        subtotal,
        shippingCost,
        total,
        'MGA',
        command.shippingAddressJson ?? null,
        now,
        now,
        orderItems,
      );

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
          shippingAddressJson: order.shippingAddressJson ?? undefined,
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
