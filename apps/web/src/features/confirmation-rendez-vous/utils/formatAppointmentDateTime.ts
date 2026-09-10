/** "15 Octobre 2026" — matches the real Stitch screen's recap card (Intl gives a lowercase month, capitalized here). */
export function formatAppointmentDate(isoDate: string): string {
  const [day, month, year] = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(isoDate))
    .split(' ');
  return `${day} ${(month ?? '').charAt(0).toUpperCase()}${(month ?? '').slice(1)} ${year}`;
}

/** "11:00" */
export function formatAppointmentTime(isoDate: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(isoDate));
}
