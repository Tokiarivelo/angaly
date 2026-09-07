import { describe, expect, it } from 'vitest';

import type { AtelierOpeningHours } from '@angaly/types';

import { buildOpeningHoursSchedule } from '../utils/buildOpeningHoursSchedule';

function makeHours(overrides: Partial<AtelierOpeningHours> = {}): AtelierOpeningHours {
  const weekday = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
  return {
    monday: weekday,
    tuesday: weekday,
    wednesday: weekday,
    thursday: weekday,
    friday: weekday,
    saturday: { isOpen: true, slots: [{ open: '10:00', close: '17:00' }] },
    sunday: { isOpen: false, slots: [] },
    ...overrides,
  };
}

describe('buildOpeningHoursSchedule', () => {
  it('groups Lundi-Vendredi, keeps Samedi distinct, and shows Dimanche as Fermé explicitly', () => {
    expect(buildOpeningHoursSchedule(makeHours())).toEqual([
      { label: 'Lundi - Vendredi', value: '09:00 - 18:00', isClosed: false },
      { label: 'Samedi', value: '10:00 - 17:00', isClosed: false },
      { label: 'Dimanche', value: 'Fermé', isClosed: true },
    ]);
  });

  it('groups consecutive closed days into one Fermé row', () => {
    const closed = { isOpen: false, slots: [] };
    const rows = buildOpeningHoursSchedule(
      makeHours({ saturday: closed, sunday: closed }),
    );
    expect(rows).toEqual([
      { label: 'Lundi - Vendredi', value: '09:00 - 18:00', isClosed: false },
      { label: 'Samedi - Dimanche', value: 'Fermé', isClosed: true },
    ]);
  });

  it('always returns exactly one row per contiguous group covering all 7 days', () => {
    const weekday = { isOpen: true, slots: [{ open: '08:00', close: '20:00' }] };
    const rows = buildOpeningHoursSchedule({
      monday: weekday,
      tuesday: weekday,
      wednesday: weekday,
      thursday: weekday,
      friday: weekday,
      saturday: weekday,
      sunday: weekday,
    });
    expect(rows).toEqual([{ label: 'Lundi - Dimanche', value: '08:00 - 20:00', isClosed: false }]);
  });
});
