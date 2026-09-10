'use client';

import type { AppointmentDto, AtelierDto } from '@angaly/types';

import { APPOINTMENT_TYPE_LABELS } from '../consts/appointment-type-labels.const';
import { buildIcsContent } from '../utils/buildIcsContent';

export interface UseAddToCalendarResult {
  downloadIcs: () => void;
}

/** "Ajouter au calendrier" — builds a one-event .ics file and triggers a browser download. */
export function useAddToCalendar(appointment: AppointmentDto | null, atelier: AtelierDto | null): UseAddToCalendarResult {
  const downloadIcs = () => {
    if (!appointment) {
      return;
    }
    const content = buildIcsContent(appointment, APPOINTMENT_TYPE_LABELS[appointment.type], atelier?.name ?? null);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `angaly-rdv-${appointment.reference}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { downloadIcs };
}
