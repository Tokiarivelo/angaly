import type { AppointmentEntity, AppointmentStatus, AppointmentType } from '../entities/appointment.entity';

export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');

export interface CreateAppointmentInput {
  reference: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: AppointmentType;
  atelierId: string;
  scheduledAt: Date;
  durationMinutes: number;
  message: string | null;
}

export interface IAppointmentRepository {
  findByReference: (reference: string) => Promise<AppointmentEntity | null>;
  create: (input: CreateAppointmentInput) => Promise<AppointmentEntity>;
  updateStatus: (id: string, status: AppointmentStatus, assignedToId?: string) => Promise<AppointmentEntity>;
  /** Active (PENDING/CONFIRMED) appointments for an atelier within [rangeStart, rangeEnd) — availability calculation + booking-conflict checks. */
  listActiveByAtelierAndRange: (atelierId: string, rangeStart: Date, rangeEnd: Date) => Promise<AppointmentEntity[]>;
  /** Every appointment for a given Customer, most recent first — powers `mes-rendez-vous`. */
  findByCustomerId: (customerId: string) => Promise<AppointmentEntity[]>;
  /** Every appointment, most recent first — staff (`MANAGER`/`ADMIN`) view. */
  findAll: () => Promise<AppointmentEntity[]>;
}
