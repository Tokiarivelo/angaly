/**
 * Domain-local mirrors of `AppointmentType`/`AppointmentStatus`
 * (`@angaly/types` / `schema.prisma`). Duplicated on purpose — the Domain
 * layer must not import `@angaly/types` (.cursor/rules/003-nestjs-clean-arch.mdc).
 */
export const APPOINTMENT_TYPES = [
  'ROBE_MARIEE',
  'COSTUME',
  'ROBE_SOIREE',
  'RETOUCHE',
  'PATRON',
  'CONSULTATION',
  'ESSAYAGE',
] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export function isAppointmentType(value: string): value is AppointmentType {
  return (APPOINTMENT_TYPES as readonly string[]).includes(value);
}

export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/** Statuses that still occupy a slot for availability purposes — never CANCELLED (see docs/features/appointments.md). */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED'];

export interface AppointmentProps {
  id: string;
  reference: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: string;
  atelierId: string;
  assignedToId: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NormalizedAppointmentProps extends Omit<AppointmentProps, 'type' | 'status'> {
  type: AppointmentType;
  status: AppointmentStatus;
}

/** Invariants: reference/firstName/lastName/phone/email non-empty, type/status recognized. */
export class AppointmentEntity {
  private constructor(private readonly props: NormalizedAppointmentProps) {}

  static create(props: AppointmentProps): AppointmentEntity {
    if (!props.reference.trim()) {
      throw new Error('Appointment.reference must not be empty');
    }
    if (!props.firstName.trim()) {
      throw new Error('Appointment.firstName must not be empty');
    }
    if (!props.lastName.trim()) {
      throw new Error('Appointment.lastName must not be empty');
    }
    if (!props.phone.trim()) {
      throw new Error('Appointment.phone must not be empty');
    }
    if (!props.email.trim()) {
      throw new Error('Appointment.email must not be empty');
    }
    if (!isAppointmentType(props.type)) {
      throw new Error(`Appointment.type must be a recognized AppointmentType, got "${props.type}"`);
    }
    if (!isAppointmentStatus(props.status)) {
      throw new Error(`Appointment.status must be a recognized AppointmentStatus, got "${props.status}"`);
    }
    return new AppointmentEntity({ ...props, type: props.type, status: props.status });
  }

  get id(): string {
    return this.props.id;
  }

  get reference(): string {
    return this.props.reference;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get phone(): string {
    return this.props.phone;
  }

  get email(): string {
    return this.props.email;
  }

  get type(): AppointmentType {
    return this.props.type;
  }

  get atelierId(): string {
    return this.props.atelierId;
  }

  get assignedToId(): string | null {
    return this.props.assignedToId;
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get message(): string | null {
    return this.props.message;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
