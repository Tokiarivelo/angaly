import { useState } from 'react';

export type AppointmentFilter = 'upcoming' | 'past' | 'cancelled';
export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';

export interface Appointment {
  id: string;
  reference: string;
  type: string;
  atelierName: string;
  atelierAddress: string;
  scheduledAt: string; // ISO string
  status: AppointmentStatus;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    reference: 'RDV-2026-001',
    type: 'Prise de mesures',
    atelierName: 'Atelier ANGALY',
    atelierAddress: 'Analakely, Antananarivo',
    scheduledAt: '2026-09-24T14:30:00Z',
    status: 'CONFIRMED',
  },
  {
    id: '2',
    reference: 'RDV-2026-002',
    type: 'Essayage essayage intermédiaire',
    atelierName: 'Atelier ANGALY',
    atelierAddress: 'Analakely, Antananarivo',
    scheduledAt: '2026-08-10T10:00:00Z',
    status: 'COMPLETED',
  },
  {
    id: '3',
    reference: 'RDV-2026-003',
    type: 'Consultation',
    atelierName: 'Atelier ANGALY',
    atelierAddress: 'Analakely, Antananarivo',
    scheduledAt: '2026-09-01T15:00:00Z',
    status: 'CANCELLED',
  },
];

export const useMyAppointments = () => {
  const [filter, setFilter] = useState<AppointmentFilter>('upcoming');

  const filteredAppointments = MOCK_APPOINTMENTS.filter((apt) => {
    if (filter === 'cancelled') return apt.status === 'CANCELLED';
    if (filter === 'upcoming') return apt.status === 'CONFIRMED' || apt.status === 'PENDING';
    if (filter === 'past') return apt.status === 'COMPLETED' || apt.status === 'NO_SHOW';
    return true;
  });

  return {
    appointments: filteredAppointments,
    filter,
    setFilter,
  };
};
