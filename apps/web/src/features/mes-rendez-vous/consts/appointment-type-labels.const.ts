import { AppointmentType } from '@angaly/types';

/** Same canonical labels as `prendre-rendez-vous`/`confirmation-rendez-vous` (duplicated on purpose — feature-sliced independence). */
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.ROBE_MARIEE]: 'Robe de mariée',
  [AppointmentType.COSTUME]: 'Costume',
  [AppointmentType.ROBE_SOIREE]: 'Robe de soirée',
  [AppointmentType.RETOUCHE]: 'Retouche',
  [AppointmentType.PATRON]: 'Patron',
  [AppointmentType.CONSULTATION]: 'Consultation',
  [AppointmentType.ESSAYAGE]: 'Essayage',
};
