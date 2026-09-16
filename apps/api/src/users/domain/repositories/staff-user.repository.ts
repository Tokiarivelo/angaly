import type { StaffRole, StaffUserEntity } from '../entities/staff-user.entity';

export const STAFF_USER_REPOSITORY = Symbol('IStaffUserRepository');

export interface StaffUserListFilter {
  role?: StaffRole;
  isActive?: boolean;
  page: number;
  limit: number;
}

export interface StaffUserListResult {
  items: StaffUserEntity[];
  total: number;
}

export interface CreateStaffUserInput {
  email: string;
  passwordHash: string;
  role: StaffRole;
}

/**
 * Scoped strictly to `role != CLIENT` rows of `User` — distinct from `auth`'s
 * `IUserRepository` on purpose, see docs/features/users.md "Points d'attention"
 * (a `Customer` profile only ever exists for `role = CLIENT`).
 */
export interface IStaffUserRepository {
  list: (filter: StaffUserListFilter) => Promise<StaffUserListResult>;
  findById: (id: string) => Promise<StaffUserEntity | null>;
  findByEmail: (email: string) => Promise<StaffUserEntity | null>;
  create: (input: CreateStaffUserInput) => Promise<StaffUserEntity>;
  updateRole: (id: string, role: StaffRole) => Promise<StaffUserEntity>;
  setActive: (id: string, isActive: boolean) => Promise<StaffUserEntity>;
}
