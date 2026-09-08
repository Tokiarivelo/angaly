import type { UserEntity, UserRole } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface NewCustomerProfile {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface IUserRepository {
  findByEmail: (email: string) => Promise<UserEntity | null>;
  findById: (id: string) => Promise<UserEntity | null>;
  /**
   * Creates the User and its 1:1 Customer profile atomically (single Prisma
   * transaction). This is the one documented cross-module exception from
   * docs/features/auth.md ("register-user orchestrant deux domaines") —
   * kept narrow to this single method rather than generalized: the
   * `customers` module's own domain/repositories aren't touched by this
   * pass, a future session can absorb Customer writes into a real
   * `customers` module without changing this method's public contract.
   */
  createWithCustomer: (
    user: { email: string; passwordHash: string; role: UserRole },
    customer: NewCustomerProfile,
  ) => Promise<UserEntity>;
  updateLastLoginAt: (userId: string, at: Date) => Promise<void>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
}
