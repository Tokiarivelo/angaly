import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppointmentEntity, AppointmentType } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { generateAppointmentReference } from '../../domain/value-objects/appointment-reference.vo';
import { DEFAULT_SLOT_MINUTES } from '../../infrastructure/services/availability-calculator.service';
import { ATELIER_REPOSITORY, IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';

export interface CreateAppointmentCommand {
  userId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  type: AppointmentType;
  atelierId: string;
  scheduledAt: Date;
  message: string | null;
}

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(command: CreateAppointmentCommand): Promise<AppointmentEntity> {
    const atelier = await this.atelierRepository.findById(command.atelierId);
    if (!atelier) {
      throw new NotFoundException(`Atelier "${command.atelierId}" not found`);
    }

    const slotEnd = new Date(command.scheduledAt.getTime() + DEFAULT_SLOT_MINUTES * 60_000);
    const conflicting = await this.appointmentRepository.listActiveByAtelierAndRange(
      command.atelierId,
      command.scheduledAt,
      slotEnd,
    );
    if (conflicting.some((appointment) => appointment.scheduledAt.getTime() === command.scheduledAt.getTime())) {
      throw new ConflictException('This slot has just been booked — please choose another one');
    }

    const customer = command.userId ? await this.customerRepository.findByUserId(command.userId) : null;

    return this.appointmentRepository.create({
      reference: generateAppointmentReference(),
      customerId: customer?.id ?? null,
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone,
      email: command.email,
      type: command.type,
      atelierId: command.atelierId,
      scheduledAt: command.scheduledAt,
      durationMinutes: DEFAULT_SLOT_MINUTES,
      message: command.message,
    });
  }
}
