import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { computeAvailableDaySlots } from '../../infrastructure/services/availability-calculator.service';
import { ATELIER_REPOSITORY, IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';

@Injectable()
export class GetDaySlotsUseCase {
  constructor(
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(atelierId: string, dateKey: string): Promise<Date[]> {
    const atelier = await this.atelierRepository.findById(atelierId);
    if (!atelier) {
      throw new NotFoundException(`Atelier "${atelierId}" not found`);
    }

    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const activeAppointmentsThatDay = await this.appointmentRepository.listActiveByAtelierAndRange(
      atelierId,
      date,
      nextDay,
    );

    return computeAvailableDaySlots(atelier.openingHours, date, activeAppointmentsThatDay);
  }
}
