import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

@Injectable()
export class CancelAppointmentUseCase {
  constructor(@Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(reference: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findByReference(reference);
    if (!appointment) {
      throw new NotFoundException(`Appointment "${reference}" not found`);
    }
    if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
      throw new BadRequestException(`Cannot cancel an appointment with status "${appointment.status}"`);
    }
    return this.appointmentRepository.updateStatus(appointment.id, 'CANCELLED');
  }
}
