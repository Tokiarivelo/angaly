import type { Appointment } from './useMyAppointments';

function toICSDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICSText(value: string): string {
  return value.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
}

export function buildICS(appointment: Appointment): string {
  const start = toICSDate(appointment.scheduledAt);
  const end = toICSDate(new Date(new Date(appointment.scheduledAt).getTime() + 45 * 60_000).toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ANGALY//Mes rendez-vous//FR',
    'BEGIN:VEVENT',
    `UID:${appointment.reference}@angaly`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICSText(`ANGALY — ${appointment.type}`)}`,
    `LOCATION:${escapeICSText(`${appointment.atelierName}, ${appointment.atelierAddress}`)}`,
    `DESCRIPTION:${escapeICSText(`Référence : ${appointment.reference}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export const useAddToCalendar = () => {
  const generateICS = (appointment: Appointment) => {
    const ics = buildICS(appointment);
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return ics;
    }

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `angaly-rdv-${appointment.reference}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return ics;
  };

  return { generateICS };
};
