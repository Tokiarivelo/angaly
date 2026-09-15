import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository';

/**
 * Controlled status transition — `Order.transitionTo()` is the single source
 * of truth for which transitions are legal (see `order.entity.ts`); this
 * use-case never writes a status it hasn't validated through it.
 *
 * Reachable two ways: the `PATCH /api/orders/:id/status` route (`MANAGER`/
 * `ADMIN` only, enforced by `RolesGuard` at the controller) and an internal
 * call from `payments` (`confirm-payment`/`refund-payment`). Emits
 * `ORDER_STATUS_CHANGED` via `notifications` best-effort — never fails the
 * status transition itself if notifying does.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

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
    await this.notifyStatusChanged(order);
    return order;
  }

  private async notifyStatusChanged(order: Order): Promise<void> {
    try {
      const customer = await this.customerRepository.findById(order.customerId);
      if (!customer) return;

      await this.createNotificationUseCase.execute({
        userId: customer.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Statut de commande mis à jour',
        body: `Votre commande ${order.orderNumber} est maintenant "${order.status}".`,
        relatedEntityType: 'Order',
        relatedEntityId: order.id,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit ORDER_STATUS_CHANGED for order ${order.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
