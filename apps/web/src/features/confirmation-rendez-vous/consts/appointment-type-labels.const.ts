import { AppointmentType } from '@angaly/types';

/**
 * Same canonical labels as `prendre-rendez-vous`'s `APPOINTMENT_TYPE_OPTIONS` (duplicated on
 * purpose — feature-sliced independence). The real Stitch screen's sample recap showed "Robe
 * de mariée sur mesure" for this field, but that's illustrative placeholder copy for the demo
 * data, not a second canonical label set — reusing the same per-type label keeps the booking
 * and confirmation screens consistent.
 */
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.ROBE_MARIEE]: 'Robe de mariée',
  [AppointmentType.COSTUME]: 'Costume',
  [AppointmentType.ROBE_SOIREE]: 'Robe de soirée',
  [AppointmentType.RETOUCHE]: 'Retouche',
  [AppointmentType.PATRON]: 'Patron',
  [AppointmentType.CONSULTATION]: 'Consultation',
  [AppointmentType.ESSAYAGE]: 'Essayage',
};
