export interface CustomerProps {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Invariants: firstName/lastName non-empty (spec — see docs/features/customers.md). */
export class CustomerEntity {
  private constructor(private readonly props: CustomerProps) {}

  static create(props: CustomerProps): CustomerEntity {
    if (!props.firstName.trim()) {
      throw new Error('Customer.firstName must not be empty');
    }
    if (!props.lastName.trim()) {
      throw new Error('Customer.lastName must not be empty');
    }
    return new CustomerEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
