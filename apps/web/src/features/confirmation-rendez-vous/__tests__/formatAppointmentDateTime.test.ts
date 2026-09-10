import { describe, expect, it } from 'vitest';

import { formatAppointmentDate, formatAppointmentTime } from '../utils/formatAppointmentDateTime';

describe('formatAppointmentDate', () => {
  it('formats as "15 Octobre 2026" (capitalized month)', () => {
    expect(formatAppointmentDate('2026-10-15T11:00:00.000Z')).toBe('15 Octobre 2026');
  });
});

describe('formatAppointmentTime', () => {
  it('formats as "11:00"', () => {
    expect(formatAppointmentTime('2026-10-15T11:00:00.000Z')).toBe('11:00');
  });
});
