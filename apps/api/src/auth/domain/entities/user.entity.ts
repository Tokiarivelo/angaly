import { isValidEmail } from '../value-objects/email.vo';

/**
 * Domain-local mirror of `Role` (`@angaly/types` / `schema.prisma`) — the
 * Domain layer must not import `@angaly/types` (.cursor/rules/003-nestjs-
 * clean-arch.mdc), keep both in sync by hand.
 */
export const USER_ROLES = ['CLIENT', 'COUTURIERE', 'MANAGER', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: email well-formed, role is a known Role. */
export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): UserEntity {
    if (!isValidEmail(props.email)) {
      throw new Error('User.email must be a valid email address');
    }
    if (!USER_ROLES.includes(props.role)) {
      throw new Error(`User.role must be one of ${USER_ROLES.join(', ')}`);
    }
    return new UserEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
