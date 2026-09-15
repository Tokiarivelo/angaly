import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { IOrderRepository } from '../../../orders/domain/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from '../../../orders/domain/repositories/order.repository';
import { Payment } from '../../domain/entities/payment.entity';
import { resolveCustomerId } from '../lib/resolve-customer-id';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';

const STAFF_ROLES: UserRole[] = ['MANAGER', 'ADMIN'];

/** `CLIENT` may only read a payment on their own order; `MANAGER`/`ADMIN` can read any. */
@Injectable()
export class GetPaymentStatusUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN) private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY_TOKEN) private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(paymentId: string, userId: string, role: UserRole): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (STAFF_ROLES.includes(role)) {
      return payment;
    }

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new NotFoundException(`Order ${payment.orderId} not found`);
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    if (order.customerId !== customerId) {
      throw new ForbiddenException('This payment does not belong to the current user');
    }

    return payment;
  }
}
