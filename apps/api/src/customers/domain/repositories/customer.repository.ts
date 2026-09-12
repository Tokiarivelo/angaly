import type { CustomerEntity } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('ICustomerRepository');

export interface UpdateCustomerProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

/**
 * No `create` method here on purpose: `Customer` rows are created exclusively
 * by `auth`.`register-user` (`IUserRepository.createWithCustomer()`, a single
 * Prisma transaction with `User` — see docs/features/auth.md "Points
 * d'attention"). Splitting that into two repositories now would break the
 * transaction's atomicity without the cross-module transaction-passing
 * infrastructure this project deliberately hasn't built; auth's own docs
 * leave "continue letting auth create the row" as the valid option this
 * module takes — see docs/features/customers.md "Points d'attention".
 */
export interface ICustomerRepository {
  findByUserId: (userId: string) => Promise<CustomerEntity | null>;
  findById: (id: string) => Promise<CustomerEntity | null>;
  update: (id: string, changes: UpdateCustomerProfileInput) => Promise<CustomerEntity>;
  create?: (userId: string, data: { firstName: string; lastName: string; phone?: string | null }) => Promise<CustomerEntity>;
}
