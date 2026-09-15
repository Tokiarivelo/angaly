import { NotFoundException } from '@nestjs/common';

import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';

/** Same pattern as `orders`/`quotes`/`patterns`' own copy (see their `application/lib/resolve-customer-id.ts`) — duplicated per module rather than imported cross-module. */
export async function resolveCustomerId(customerRepository: ICustomerRepository, userId: string): Promise<string> {
  const customer = await customerRepository.findByUserId(userId);
  if (customer) {
    return customer.id;
  }

  // Auto-provision Customer profile for accounts (e.g. ADMIN, STAFF or legacy users)
  if (customerRepository.create) {
    try {
      const created = await customerRepository.create(userId, {
        firstName: 'Compte',
        lastName: 'ANGALY',
      });
      return created.id;
    } catch {
      const fallback = await customerRepository.findByUserId(userId);
      if (fallback) {
        return fallback.id;
      }
    }
  }

  throw new NotFoundException('Customer profile not found');
}
