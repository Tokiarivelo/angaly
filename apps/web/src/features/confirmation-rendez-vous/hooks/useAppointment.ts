'use client';

import { useMemo } from 'react';
import type { AppointmentDto, AtelierDto } from '@angaly/types';

import { useAppointmentQuery, useAteliersQuery } from '../api/appointments.api';

export interface UseAppointmentResult {
  appointment: AppointmentDto | null;
  atelier: AtelierDto | null;
  isLoading: boolean;
  isError: boolean;
}

/** Loads the appointment by reference, then resolves its atelier from the (small) ateliers list. */
export function useAppointment(reference: string): UseAppointmentResult {
  const appointmentQuery = useAppointmentQuery(reference);
  const ateliersQuery = useAteliersQuery();

  const appointment = appointmentQuery.data ?? null;
  const atelier = useMemo(
    () => (appointment ? (ateliersQuery.data?.find((candidate) => candidate.id === appointment.atelierId) ?? null) : null),
    [appointment, ateliersQuery.data],
  );

  return {
    appointment,
    atelier,
    isLoading: appointmentQuery.isLoading,
    isError: appointmentQuery.isError,
  };
}
