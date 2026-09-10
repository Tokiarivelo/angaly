import type { AtelierOpeningHours } from '../../../ateliers/domain/value-objects/opening-hours.vo';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import {
  computeAvailableDaySlots,
  computeDayAvailability,
  computeDaySlotStartMinutes,
} from '../../infrastructure/services/availability-calculator.service';

function openingHours(overrides: Partial<AtelierOpeningHours> = {}): AtelierOpeningHours {
  const closed = { isOpen: false, slots: [] };
  return {
    monday: { isOpen: true, slots: [{ open: '09:00', close: '10:30' }] },
    tuesday: closed,
    wednesday: closed,
    thursday: closed,
    friday: closed,
    saturday: closed,
    sunday: closed,
    ...overrides,
  };
}

// A UTC Monday.
const MONDAY = new Date('2026-09-14T00:00:00.000Z');
const TUESDAY = new Date('2026-09-15T00:00:00.000Z');

function sampleAppointment(scheduledAt: Date, status: AppointmentEntity['status'] = 'PENDING'): AppointmentEntity {
  return AppointmentEntity.create({
    id: 'appointment-1',
    reference: 'ANG-RDV-2026-AbCdEfGh',
    customerId: null,
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: '+261 34 12 345 67',
    email: 'nirina@example.com',
    type: 'ESSAYAGE',
    atelierId: 'atelier-1',
    assignedToId: null,
    scheduledAt,
    durationMinutes: 45,
    status,
    message: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('computeDaySlotStartMinutes', () => {
  it('returns no slots for a closed day', () => {
    expect(computeDaySlotStartMinutes(openingHours(), TUESDAY)).toEqual([]);
  });

  it('returns every 45-minute slot start within the opening window', () => {
    // 09:00–10:30 = 90 minutes → 09:00 (540) and 09:45 (585); a third slot would end at 11:15, past 10:30.
    expect(computeDaySlotStartMinutes(openingHours(), MONDAY)).toEqual([540, 585]);
  });

  it('spans multiple windows in the same day', () => {
    const hours = openingHours({
      monday: {
        isOpen: true,
        slots: [
          { open: '09:00', close: '09:45' },
          { open: '14:00', close: '14:45' },
        ],
      },
    });
    expect(computeDaySlotStartMinutes(hours, MONDAY)).toEqual([540, 840]);
  });
});

describe('computeDayAvailability', () => {
  it('returns "closed" when the atelier is closed that weekday', () => {
    expect(computeDayAvailability(openingHours(), TUESDAY, [])).toBe('closed');
  });

  it('returns "available" when fewer appointments than slots exist', () => {
    expect(computeDayAvailability(openingHours(), MONDAY, [sampleAppointment(new Date('2026-09-14T09:00:00.000Z'))])).toBe(
      'available',
    );
  });

  it('returns "full" when every slot is booked', () => {
    const appointments = [
      sampleAppointment(new Date('2026-09-14T09:00:00.000Z')),
      sampleAppointment(new Date('2026-09-14T09:45:00.000Z')),
    ];
    expect(computeDayAvailability(openingHours(), MONDAY, appointments)).toBe('full');
  });
});

describe('computeAvailableDaySlots', () => {
  it('returns every slot when nothing is booked', () => {
    const slots = computeAvailableDaySlots(openingHours(), MONDAY, []);
    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-09-14T09:00:00.000Z',
      '2026-09-14T09:45:00.000Z',
    ]);
  });

  it('excludes a slot that already has an active appointment', () => {
    const slots = computeAvailableDaySlots(openingHours(), MONDAY, [
      sampleAppointment(new Date('2026-09-14T09:00:00.000Z')),
    ]);
    expect(slots.map((slot) => slot.toISOString())).toEqual(['2026-09-14T09:45:00.000Z']);
  });

  it('returns no slots for a closed day', () => {
    expect(computeAvailableDaySlots(openingHours(), TUESDAY, [])).toEqual([]);
  });
});
