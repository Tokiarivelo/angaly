/**
 * Domain-local mirrors of `Role`/email validation (`@angaly/types`, `auth`'s
 * own domain) — the Domain layer must not import `@angaly/types` nor another
 * module's domain (.cursor/rules/003-nestjs-clean-arch.mdc), keep in sync by hand.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Staff accounts only — `CLIENT` is out of scope for this module, see docs/features/users.md. */
export const STAFF_ROLES = ['COUTURIERE', 'MANAGER', 'ADMIN'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export interface StaffUserProps {
  id: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: email well-formed, role is one of STAFF_ROLES (never CLIENT). */
export class StaffUserEntity {
  private constructor(private readonly props: StaffUserProps) {}

  static create(props: StaffUserProps): StaffUserEntity {
    if (!EMAIL_REGEX.test(props.email)) {
      throw new Error('StaffUser.email must be a valid email address');
    }
    if (!isStaffRole(props.role)) {
      throw new Error(`StaffUser.role must be one of ${STAFF_ROLES.join(', ')}`);
    }
    return new StaffUserEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get role(): StaffRole {
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
