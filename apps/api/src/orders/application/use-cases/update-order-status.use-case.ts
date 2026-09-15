import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository';

/**
 * Controlled status transition — `Order.transitionTo()` is the single source
 * of truth for which transitions are legal (see `order.entity.ts`); this
 * use-case never writes a status it hasn't validated through it.
 *
 * Reachable two ways: the `PATCH /api/orders/:id/status` route (`MANAGER`/
 * `ADMIN` only, enforced by `RolesGuard` at the controller) and, per
 * `docs/features/orders.md` "Points d'intégration", an internal call from
 * `payments` once the `notifications` module exists to emit
 * `ORDER_STATUS_CHANGED` — not wired yet, see that module's TODO.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    try {
      order.transitionTo(newStatus);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid order status transition');
    }

    await this.orderRepository.update(order);
    return order;
  }
}
