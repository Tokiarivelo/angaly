import type { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { AtelierOpeningHours, AtelierWeekday } from '../../../ateliers/domain/value-objects/opening-hours.vo';

/**
 * Infrastructure, not domain: reads `ateliers`'s already-parsed
 * `AtelierOpeningHours` directly (see docs/features/appointments.md "Points
 * d'intégration" — this cross-module type is exactly what that fiche names).
 * Pure functions, no DB/Nest DI needed — called directly by this module's
 * use-cases, same as CreationMapper's static methods elsewhere.
 */
export type DayAvailabilityStatus = 'available' | 'full' | 'closed';

/** Fixed slot granularity for capacity purposes — `Appointment.durationMinutes` can vary by type, but availability is computed against this default (see docs/features/appointments.md "Points d'attention"). */
export const DEFAULT_SLOT_MINUTES = 45;

const WEEKDAY_BY_UTC_DAY: AtelierWeekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function toWeekday(date: Date): AtelierWeekday {
  return WEEKDAY_BY_UTC_DAY[date.getUTCDay()];
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Every possible slot start time (minutes from UTC midnight) within a day's opening windows. */
export function computeDaySlotStartMinutes(openingHours: AtelierOpeningHours, date: Date): number[] {
  const dayHours = openingHours[toWeekday(date)];
  if (!dayHours.isOpen) {
    return [];
  }

  const starts: number[] = [];
  for (const slot of dayHours.slots) {
    const open = parseTimeToMinutes(slot.open);
    const close = parseTimeToMinutes(slot.close);
    for (let start = open; start + DEFAULT_SLOT_MINUTES <= close; start += DEFAULT_SLOT_MINUTES) {
      starts.push(start);
    }
  }
  return starts;
}

/** available / full / closed for one calendar day — `activeAppointmentsThatDay` must already be filtered to that atelier + that day + active statuses. */
export function computeDayAvailability(
  openingHours: AtelierOpeningHours,
  date: Date,
  activeAppointmentsThatDay: AppointmentEntity[],
): DayAvailabilityStatus {
  const totalSlots = computeDaySlotStartMinutes(openingHours, date);
  if (totalSlots.length === 0) {
    return 'closed';
  }
  return activeAppointmentsThatDay.length >= totalSlots.length ? 'full' : 'available';
}

/** The specific start times still free that day, as real Date objects (UTC). */
export function computeAvailableDaySlots(
  openingHours: AtelierOpeningHours,
  date: Date,
  activeAppointmentsThatDay: AppointmentEntity[],
): Date[] {
  const bookedStartMinutes = new Set(
    activeAppointmentsThatDay.map((appointment) => {
      const scheduled = appointment.scheduledAt;
      return scheduled.getUTCHours() * 60 + scheduled.getUTCMinutes();
    }),
  );

  return computeDaySlotStartMinutes(openingHours, date)
    .filter((start) => !bookedStartMinutes.has(start))
    .map((start) => {
      const slot = new Date(date);
      slot.setUTCHours(Math.floor(start / 60), start % 60, 0, 0);
      return slot;
    });
}
