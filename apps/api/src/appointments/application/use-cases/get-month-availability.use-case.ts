import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { computeDayAvailability, DayAvailabilityStatus } from '../../infrastructure/services/availability-calculator.service';
import { ATELIER_REPOSITORY, IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import type { AppointmentEntity } from '../../domain/entities/appointment.entity';

export interface MonthAvailabilityDay {
  date: string;
  status: DayAvailabilityStatus;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class GetMonthAvailabilityUseCase {
  constructor(
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(atelierId: string, month: string): Promise<MonthAvailabilityDay[]> {
    const atelier = await this.atelierRepository.findById(atelierId);
    if (!atelier) {
      throw new NotFoundException(`Atelier "${atelierId}" not found`);
    }

    const [year, monthNumber] = month.split('-').map(Number) as [number, number];
    const rangeStart = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
    const rangeEnd = new Date(Date.UTC(year, monthNumber, 1, 0, 0, 0));
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    const activeAppointments = await this.appointmentRepository.listActiveByAtelierAndRange(
      atelierId,
      rangeStart,
      rangeEnd,
    );

    const days: MonthAvailabilityDay[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(year, monthNumber - 1, day));
      const appointmentsThatDay = filterAppointmentsForDay(activeAppointments, date);
      days.push({ date: toDateKey(date), status: computeDayAvailability(atelier.openingHours, date, appointmentsThatDay) });
    }
    return days;
  }
}

/** `appointments` is already active-status-filtered by the repository contract (listActiveByAtelierAndRange). */
function filterAppointmentsForDay(appointments: AppointmentEntity[], date: Date): AppointmentEntity[] {
  return appointments.filter((appointment) => isSameUtcDay(appointment.scheduledAt, date));
}
