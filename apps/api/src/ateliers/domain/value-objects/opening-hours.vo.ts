/**
 * Domain-local mirror of `AtelierOpeningHours` (`@angaly/types`). Duplicated on
 * purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both in sync by hand.
 */
export const ATELIER_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type AtelierWeekday = (typeof ATELIER_WEEKDAYS)[number];

export interface AtelierTimeSlot {
  open: string;
  close: string;
}

export interface AtelierDayHours {
  isOpen: boolean;
  slots: AtelierTimeSlot[];
}

export type AtelierOpeningHours = Record<AtelierWeekday, AtelierDayHours>;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isTimeSlot(value: unknown): value is AtelierTimeSlot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const slot = value as Record<string, unknown>;
  return typeof slot['open'] === 'string' && typeof slot['close'] === 'string'
    ? TIME_PATTERN.test(slot['open']) && TIME_PATTERN.test(slot['close'])
    : false;
}

function isDayHours(value: unknown): value is AtelierDayHours {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const day = value as Record<string, unknown>;
  return typeof day['isOpen'] === 'boolean' && Array.isArray(day['slots']) && day['slots'].every(isTimeSlot);
}

/** Parses `Atelier.openingHoursJson` (an untyped Prisma Json column) into a validated shape. */
export function parseOpeningHours(raw: unknown): AtelierOpeningHours {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Atelier.openingHoursJson must be an object keyed by weekday');
  }
  const source = raw as Record<string, unknown>;
  const result = {} as AtelierOpeningHours;
  for (const day of ATELIER_WEEKDAYS) {
    const value = source[day];
    if (!isDayHours(value)) {
      throw new Error(`Atelier.openingHoursJson.${day} is missing or malformed`);
    }
    result[day] = value;
  }
  return result;
}
