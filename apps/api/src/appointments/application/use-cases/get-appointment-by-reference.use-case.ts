import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';

@Injectable()
export class GetAppointmentByReferenceUseCase {
  constructor(@Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(reference: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findByReference(reference);
    if (!appointment) {
      throw new NotFoundException(`Appointment "${reference}" not found`);
    }
    return appointment;
  }
}
