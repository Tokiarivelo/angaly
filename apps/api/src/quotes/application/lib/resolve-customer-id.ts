import { NotFoundException } from '@nestjs/common';

import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';

/** Shared by every `quotes` use-case reached with a JWT userId (see create-appointment.use-case.ts for the same pattern). */
export async function resolveCustomerId(customerRepository: ICustomerRepository, userId: string): Promise<string> {
  const customer = await customerRepository.findByUserId(userId);
  if (!customer) {
    throw new NotFoundException('Customer profile not found');
  }
  return customer.id;
}
