import { AppointmentType } from '@angaly/types';

/** Order and labels verified live on the Stitch screen "ANGALY — Prendre rendez-vous (Booking)". */
export const APPOINTMENT_TYPE_OPTIONS: { value: AppointmentType; label: string }[] = [
  { value: AppointmentType.ROBE_MARIEE, label: 'Robe de mariée' },
  { value: AppointmentType.COSTUME, label: 'Costume' },
  { value: AppointmentType.ROBE_SOIREE, label: 'Robe de soirée' },
  { value: AppointmentType.RETOUCHE, label: 'Retouche' },
  { value: AppointmentType.PATRON, label: 'Patron' },
  { value: AppointmentType.CONSULTATION, label: 'Consultation' },
  { value: AppointmentType.ESSAYAGE, label: 'Essayage' },
];
