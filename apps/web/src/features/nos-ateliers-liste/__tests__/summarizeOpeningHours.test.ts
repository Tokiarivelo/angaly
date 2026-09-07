import { describe, expect, it } from 'vitest';

import type { AtelierOpeningHours } from '@angaly/types';

import { summarizeOpeningHours } from '../utils/summarizeOpeningHours';

const CLOSED = { isOpen: false, slots: [] };

function makeHours(overrides: Partial<AtelierOpeningHours> = {}): AtelierOpeningHours {
  const weekday = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
  return {
    monday: weekday,
    tuesday: weekday,
    wednesday: weekday,
    thursday: weekday,
    friday: weekday,
    saturday: { isOpen: true, slots: [{ open: '09:00', close: '13:00' }] },
    sunday: CLOSED,
    ...overrides,
  };
}

describe('summarizeOpeningHours', () => {
  it('groups consecutive days sharing identical hours into one line', () => {
    expect(summarizeOpeningHours(makeHours())).toEqual([
      'Lun - Ven : 09h00 - 18h00',
      'Sam : 09h00 - 13h00',
    ]);
  });

  it('omits closed days entirely (no "Fermé" line)', () => {
    const lines = summarizeOpeningHours(makeHours());
    expect(lines.join(' ')).not.toContain('Dim');
  });

  it('collapses a single-slot week into one range covering all 7 days', () => {
    const weekday = { isOpen: true, slots: [{ open: '10:00', close: '19:00' }] };
    const hours = makeHours({
      monday: weekday,
      tuesday: weekday,
      wednesday: weekday,
      thursday: weekday,
      friday: weekday,
      saturday: weekday,
      sunday: weekday,
    });
    expect(summarizeOpeningHours(hours)).toEqual(['Lun - Dim : 10h00 - 19h00']);
  });

  it('returns an empty array when every day is closed', () => {
    const hours = makeHours({
      monday: CLOSED,
      tuesday: CLOSED,
      wednesday: CLOSED,
      thursday: CLOSED,
      friday: CLOSED,
      saturday: CLOSED,
      sunday: CLOSED,
    });
    expect(summarizeOpeningHours(hours)).toEqual([]);
  });

  it('keeps a lone open day as a single-day label, not a range', () => {
    const hours = makeHours({
      monday: CLOSED,
      tuesday: CLOSED,
      wednesday: CLOSED,
      thursday: CLOSED,
      friday: CLOSED,
      saturday: { isOpen: true, slots: [{ open: '10:00', close: '13:00' }] },
      sunday: CLOSED,
    });
    expect(summarizeOpeningHours(hours)).toEqual(['Sam : 10h00 - 13h00']);
  });
});
