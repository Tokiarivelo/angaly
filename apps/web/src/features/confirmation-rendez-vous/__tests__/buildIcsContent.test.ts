import { AppointmentStatus, AppointmentType } from '@angaly/types';
import type { AppointmentDto } from '@angaly/types';
import { describe, expect, it } from 'vitest';

import { buildIcsContent } from '../utils/buildIcsContent';

const APPOINTMENT: AppointmentDto = {
  id: 'appointment-1',
  reference: 'ANG-RDV-2026-AbCdEfGh',
  customerId: null,
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  type: AppointmentType.ESSAYAGE,
  atelierId: 'atelier-1',
  assignedToId: null,
  scheduledAt: '2026-10-15T11:00:00.000Z',
  durationMinutes: 45,
  status: AppointmentStatus.PENDING,
  message: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('buildIcsContent', () => {
  it('produces a valid single-event VCALENDAR with the appointment reference and location', () => {
    const ics = buildIcsContent(APPOINTMENT, 'Essayage', 'Atelier Antananarivo Centre');

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:ANG-RDV-2026-AbCdEfGh@angaly.mg');
    expect(ics).toContain('DTSTART:20261015T110000Z');
    expect(ics).toContain('DTEND:20261015T114500Z');
    expect(ics).toContain('SUMMARY:Rendez-vous ANGALY — Essayage');
    expect(ics).toContain('LOCATION:Atelier Antananarivo Centre');
  });

  it('falls back to a generic location when no atelier name is known', () => {
    const ics = buildIcsContent(APPOINTMENT, 'Essayage', null);

    expect(ics).toContain('LOCATION:Atelier ANGALY');
  });
});
