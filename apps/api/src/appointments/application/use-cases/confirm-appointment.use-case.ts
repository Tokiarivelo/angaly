import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';

@Injectable()
export class ConfirmAppointmentUseCase {
  constructor(@Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(reference: string, assignedToId: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findByReference(reference);
    if (!appointment) {
      throw new NotFoundException(`Appointment "${reference}" not found`);
    }
    if (appointment.status !== 'PENDING') {
      throw new BadRequestException(`Only a PENDING appointment can be confirmed (current status: "${appointment.status}")`);
    }
    return this.appointmentRepository.updateStatus(appointment.id, 'CONFIRMED', assignedToId);
  }
}
