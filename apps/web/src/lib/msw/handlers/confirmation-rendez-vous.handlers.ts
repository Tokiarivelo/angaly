import { HttpResponse, http } from 'msw';
import { AppointmentStatus, AppointmentType } from '@angaly/types';
import type { AppointmentDto, AtelierDto } from '@angaly/types';

const API_BASE_URL = 'http://localhost:3003/api';

export const SAMPLE_ATELIER: AtelierDto = {
  id: 'atelier-1',
  slug: 'antananarivo-centre',
  name: 'Atelier Antananarivo Centre',
  address: "12 Rue de l'Artisanat",
  city: 'Antananarivo',
  phone: null,
  openingHours: {
    monday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    tuesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    wednesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    thursday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    friday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    saturday: { isOpen: false, slots: [] },
    sunday: { isOpen: false, slots: [] },
  },
  services: [],
  latitude: -18.8827,
  longitude: 47.5177,
  media: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const SAMPLE_APPOINTMENT: AppointmentDto = {
  id: 'appointment-1',
  reference: 'ANG-RDV-2026-AbCdEfGh',
  customerId: null,
  firstName: 'Nirina',
  lastName: 'Rakoto',
  phone: '+261 34 12 345 67',
  email: 'nirina@example.com',
  type: AppointmentType.ROBE_MARIEE,
  atelierId: 'atelier-1',
  assignedToId: null,
  scheduledAt: '2026-10-15T11:00:00.000Z',
  durationMinutes: 45,
  status: AppointmentStatus.PENDING,
  message: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const confirmationRendezVousHandlers = [
  http.get(`${API_BASE_URL}/ateliers`, () => HttpResponse.json({ success: true, data: [SAMPLE_ATELIER] })),
  http.get(`${API_BASE_URL}/appointments/:reference`, () =>
    HttpResponse.json({ success: true, data: SAMPLE_APPOINTMENT }),
  ),
  http.post(`${API_BASE_URL}/appointments/:reference/cancel`, () =>
    HttpResponse.json({ success: true, data: { ...SAMPLE_APPOINTMENT, status: AppointmentStatus.CANCELLED } }),
  ),
];
