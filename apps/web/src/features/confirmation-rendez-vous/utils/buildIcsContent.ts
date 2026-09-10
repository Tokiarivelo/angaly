import type { AppointmentDto } from '@angaly/types';

function toIcsDateTime(iso: string): string {
  return `${iso.replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** Minimal single-event .ics file (RFC 5545) for "Ajouter au calendrier". */
export function buildIcsContent(appointment: AppointmentDto, typeLabel: string, atelierName: string | null): string {
  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
  const location = atelierName ?? 'Atelier ANGALY';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ANGALY//Prise de rendez-vous//FR',
    'BEGIN:VEVENT',
    `UID:${appointment.reference}@angaly.mg`,
    `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
    `DTSTART:${toIcsDateTime(start.toISOString())}`,
    `DTEND:${toIcsDateTime(end.toISOString())}`,
    `SUMMARY:Rendez-vous ANGALY — ${typeLabel}`,
    `LOCATION:${location}`,
    `DESCRIPTION:Référence ${appointment.reference}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
