import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

const STAFF_ROLES: UserRole[] = ['MANAGER', 'ADMIN'];

/** `CLIENT` may only read their own order; `MANAGER`/`ADMIN` can read any. */
@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(orderId: string, userId: string, role: UserRole): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (STAFF_ROLES.includes(role)) {
      return order;
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('This order does not belong to the current user');
    }

    return order;
  }
}
