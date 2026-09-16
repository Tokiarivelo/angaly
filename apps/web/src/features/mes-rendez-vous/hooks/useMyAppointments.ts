'use client';

import { useMemo, useState } from 'react';
import { AppointmentStatus as BackendAppointmentStatus } from '@angaly/types';

import { useAteliersQuery, useMyAppointmentsQuery } from '../api/appointments.api';
import { APPOINTMENT_TYPE_LABELS } from '../consts/appointment-type-labels.const';

export type AppointmentFilter = 'upcoming' | 'past' | 'cancelled';
export type AppointmentStatus = BackendAppointmentStatus;

export interface Appointment {
  id: string;
  reference: string;
  type: string;
  atelierName: string;
  atelierAddress: string;
  scheduledAt: string; // ISO string
  status: AppointmentStatus;
}

/**
 * Combines `GET /api/appointments` (mine) with the (small) `GET /api/ateliers`
 * list to resolve each appointment's atelier name/address, same join pattern
 * as `confirmation-rendez-vous`'s `useAppointment.ts`.
 *
 * Filter rule (see docs/pages/mes-rendez-vous.md "Points d'attention"):
 * `CANCELLED` always wins over temporality; `NO_SHOW` appears under "Passés".
 */
export const useMyAppointments = () => {
  const [filter, setFilter] = useState<AppointmentFilter>('upcoming');
  const appointmentsQuery = useMyAppointmentsQuery();
  const ateliersQuery = useAteliersQuery();

  const appointments: Appointment[] = useMemo(() => {
    const ateliers = ateliersQuery.data ?? [];
    return (appointmentsQuery.data ?? []).map((appointment) => {
      const atelier = ateliers.find((candidate) => candidate.id === appointment.atelierId);
      return {
        id: appointment.id,
        reference: appointment.reference,
        type: APPOINTMENT_TYPE_LABELS[appointment.type] ?? appointment.type,
        atelierName: atelier?.name ?? 'Atelier ANGALY',
        atelierAddress: atelier?.address ?? '',
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
      };
    });
  }, [appointmentsQuery.data, ateliersQuery.data]);

  const filteredAppointments = useMemo(() => {
    const now = Date.now();
    return appointments.filter((apt) => {
      if (apt.status === BackendAppointmentStatus.CANCELLED) {
        return filter === 'cancelled';
      }
      if (filter === 'cancelled') {
        return false;
      }
      const isPast =
        apt.status === BackendAppointmentStatus.COMPLETED ||
        apt.status === BackendAppointmentStatus.NO_SHOW ||
        new Date(apt.scheduledAt).getTime() < now;
      return filter === 'past' ? isPast : !isPast;
    });
  }, [appointments, filter]);

  return {
    appointments: filteredAppointments,
    filter,
    setFilter,
    isLoading: appointmentsQuery.isLoading,
    isError: appointmentsQuery.isError,
  };
};
