import { Injectable } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { ACTIVE_APPOINTMENT_STATUSES, AppointmentEntity, AppointmentStatus } from '../../domain/entities/appointment.entity';
import { CreateAppointmentInput, IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentMapper } from '../mappers/appointment.mapper';

export const APPOINTMENT_SELECT = {
  id: true,
  reference: true,
  customerId: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  type: true,
  atelierId: true,
  assignedToId: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
  message: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppointmentSelect;

export type AppointmentRecord = Prisma.AppointmentGetPayload<{ select: typeof APPOINTMENT_SELECT }>;

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByReference(reference: string): Promise<AppointmentEntity | null> {
    const record = await this.prisma.appointment.findUnique({ where: { reference }, select: APPOINTMENT_SELECT });
    return record ? AppointmentMapper.toDomain(record) : null;
  }

  async create(input: CreateAppointmentInput): Promise<AppointmentEntity> {
    const record = await this.prisma.appointment.create({
      data: {
        reference: input.reference,
        customerId: input.customerId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        type: input.type,
        atelierId: input.atelierId,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        message: input.message,
      },
      select: APPOINTMENT_SELECT,
    });
    return AppointmentMapper.toDomain(record);
  }

  async updateStatus(id: string, status: AppointmentStatus, assignedToId?: string): Promise<AppointmentEntity> {
    const record = await this.prisma.appointment.update({
      where: { id },
      data: { status, ...(assignedToId !== undefined && { assignedToId }) },
      select: APPOINTMENT_SELECT,
    });
    return AppointmentMapper.toDomain(record);
  }

  async listActiveByAtelierAndRange(atelierId: string, rangeStart: Date, rangeEnd: Date): Promise<AppointmentEntity[]> {
    const records = await this.prisma.appointment.findMany({
      where: {
        atelierId,
        status: { in: ACTIVE_APPOINTMENT_STATUSES },
        scheduledAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: APPOINTMENT_SELECT,
    });
    return records.map((record) => AppointmentMapper.toDomain(record));
  }
}
