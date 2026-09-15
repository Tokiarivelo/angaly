import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@angaly/types';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

/**
 * Owner-only cancellation. `Order.transitionTo(CANCELLED)` already restricts
 * this to `PENDING`/`CONFIRMED` orders (see the entity's transition map) —
 * this use-case doesn't duplicate that rule, only the ownership check.
 */
@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('This order does not belong to the current user');
    }

    try {
      order.transitionTo(OrderStatus.CANCELLED);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'This order can no longer be cancelled');
    }

    await this.orderRepository.update(order);
    return order;
  }
}
