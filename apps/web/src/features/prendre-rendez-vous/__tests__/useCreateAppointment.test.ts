import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppointmentType } from '@angaly/types';

import { withQueryClient } from '@/lib/test-utils';

import { useCreateAppointment } from '../hooks/useCreateAppointment';
import type { AppointmentFormValues } from '../schemas/appointment.schema';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/prendre-rendez-vous',
  useSearchParams: () => new URLSearchParams(),
}));

const VALUES: AppointmentFormValues = {
  type: AppointmentType.ESSAYAGE,
  atelierId: 'atelier-1',
  date: '2026-09-14',
  scheduledAt: '2026-09-14T09:00:00.000Z',
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  message: '',
};

describe('useCreateAppointment', () => {
  it('creates the appointment then redirects to its confirmation page', async () => {
    const { result } = renderHook(() => useCreateAppointment(), { wrapper: withQueryClient() });

    act(() => result.current.submit(VALUES));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/rendez-vous/ANG-RDV-2026-AbCdEfGh/confirmation'));
  });
});
