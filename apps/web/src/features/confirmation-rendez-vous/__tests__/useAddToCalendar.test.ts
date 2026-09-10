import { renderHook } from '@testing-library/react';
import { AppointmentStatus, AppointmentType } from '@angaly/types';
import type { AppointmentDto } from '@angaly/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAddToCalendar } from '../hooks/useAddToCalendar';

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

describe('useAddToCalendar', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when there is no appointment yet', () => {
    const { result } = renderHook(() => useAddToCalendar(null, null));

    expect(() => result.current.downloadIcs()).not.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('builds and downloads an .ics file for the appointment', () => {
    const { result } = renderHook(() => useAddToCalendar(APPOINTMENT, null));

    result.current.downloadIcs();

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
