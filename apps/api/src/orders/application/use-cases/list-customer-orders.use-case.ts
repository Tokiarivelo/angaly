import { Inject, Injectable } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/order.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

const STAFF_ROLES: UserRole[] = ['MANAGER', 'ADMIN'];

/** `CLIENT` sees their own orders; `MANAGER`/`ADMIN` see every order. */
@Injectable()
export class ListCustomerOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(userId: string, role: UserRole): Promise<Order[]> {
    if (STAFF_ROLES.includes(role)) {
      return this.orderRepository.findAll();
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    return this.orderRepository.findByCustomerId(customerId);
  }
}
