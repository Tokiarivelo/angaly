import { ATELIER_WEEKDAYS } from '@angaly/types';
import type { AtelierOpeningHours, AtelierWeekday } from '@angaly/types';

const WEEKDAY_LABELS: Record<AtelierWeekday, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

export interface OpeningHoursRow {
  label: string;
  value: string;
  isClosed: boolean;
}

function daySignature(hours: AtelierOpeningHours[AtelierWeekday]): string {
  if (!hours.isOpen || hours.slots.length === 0) return 'Fermé';
  return hours.slots.map((slot) => `${slot.open} - ${slot.close}`).join(', ');
}

/**
 * Unlike nos-ateliers-liste's `summarizeOpeningHours` (abbreviated labels, closed days
 * omitted — a compact card), the real Stitch detail screen shows every day, full weekday
 * names, and an explicit "Fermé" row for Dimanche — a day-by-day list, not a summary card.
 * Kept as a separate implementation per feature-sliced isolation (no cross-feature import).
 */
export function buildOpeningHoursSchedule(openingHours: AtelierOpeningHours): OpeningHoursRow[] {
  const rows: OpeningHoursRow[] = [];
  let groupStart: AtelierWeekday | null = null;
  let groupEnd: AtelierWeekday | null = null;
  let groupSignature: string | null = null;

  const flushGroup = () => {
    if (groupStart === null || groupEnd === null || groupSignature === null) return;
    const label =
      groupStart === groupEnd
        ? WEEKDAY_LABELS[groupStart]
        : `${WEEKDAY_LABELS[groupStart]} - ${WEEKDAY_LABELS[groupEnd]}`;
    rows.push({ label, value: groupSignature, isClosed: groupSignature === 'Fermé' });
  };

  for (const day of ATELIER_WEEKDAYS) {
    const signature = daySignature(openingHours[day]);

    if (signature === groupSignature) {
      groupEnd = day;
      continue;
    }

    flushGroup();
    groupStart = day;
    groupEnd = day;
    groupSignature = signature;
  }
  flushGroup();

  return rows;
}
