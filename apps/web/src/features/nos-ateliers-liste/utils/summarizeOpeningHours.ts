import { ATELIER_WEEKDAYS } from '@angaly/types';
import type { AtelierOpeningHours, AtelierWeekday } from '@angaly/types';

const WEEKDAY_LABELS: Record<AtelierWeekday, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Jeu',
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
};

function formatTime(time: string): string {
  return time.replace(':', 'h');
}

function daySignature(hours: AtelierOpeningHours[AtelierWeekday]): string | null {
  if (!hours.isOpen || hours.slots.length === 0) return null;
  return hours.slots.map((slot) => `${formatTime(slot.open)} - ${formatTime(slot.close)}`).join(', ');
}

/**
 * Groups consecutive open weekdays sharing identical hours into compact lines, matching
 * the real Stitch screen's "Mar - Sam : 10h00 - 18h00" style (never a raw 7-day dump).
 * Closed days are simply omitted, same as the real mockup shows no "closed" line.
 */
export function summarizeOpeningHours(openingHours: AtelierOpeningHours): string[] {
  const lines: string[] = [];
  let groupStart: AtelierWeekday | null = null;
  let groupEnd: AtelierWeekday | null = null;
  let groupSignature: string | null = null;

  const flushGroup = () => {
    if (groupStart === null || groupEnd === null || groupSignature === null) return;
    const label =
      groupStart === groupEnd
        ? WEEKDAY_LABELS[groupStart]
        : `${WEEKDAY_LABELS[groupStart]} - ${WEEKDAY_LABELS[groupEnd]}`;
    lines.push(`${label} : ${groupSignature}`);
  };

  for (const day of ATELIER_WEEKDAYS) {
    const signature = daySignature(openingHours[day]);

    if (signature === null) {
      flushGroup();
      groupStart = null;
      groupEnd = null;
      groupSignature = null;
      continue;
    }

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

  return lines;
}
