import { Inject, Injectable } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository, PAYMENT_REPOSITORY_TOKEN } from '../../domain/repositories/payment.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

const STAFF_ROLES: UserRole[] = ['MANAGER', 'ADMIN'];

/** `CLIENT` sees only payments for their own orders; `MANAGER`/`ADMIN` see every payment. Mirrors `orders`' `ListCustomerOrdersUseCase`. */
@Injectable()
export class ListCustomerPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN) private readonly paymentRepository: IPaymentRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(userId: string, role: UserRole): Promise<Payment[]> {
    if (STAFF_ROLES.includes(role)) {
      return this.paymentRepository.findAll();
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    return this.paymentRepository.findByCustomerId(customerId);
  }
}
