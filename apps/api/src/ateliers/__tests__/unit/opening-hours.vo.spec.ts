import { ATELIER_WEEKDAYS, parseOpeningHours } from '../../domain/value-objects/opening-hours.vo';

function validRawHours() {
  const closed = { isOpen: false, slots: [] };
  const open = { isOpen: true, slots: [{ open: '09:00', close: '18:00' }] };
  return {
    monday: open,
    tuesday: open,
    wednesday: open,
    thursday: open,
    friday: open,
    saturday: open,
    sunday: closed,
  };
}

describe('parseOpeningHours', () => {
  it('parses a well-formed weekday-keyed object', () => {
    const result = parseOpeningHours(validRawHours());

    expect(ATELIER_WEEKDAYS.every((day) => day in result)).toBe(true);
    expect(result.monday.isOpen).toBe(true);
    expect(result.monday.slots).toEqual([{ open: '09:00', close: '18:00' }]);
    expect(result.sunday.isOpen).toBe(false);
  });

  it('throws when the input is not an object', () => {
    expect(() => parseOpeningHours('not-an-object')).toThrow(
      'Atelier.openingHoursJson must be an object keyed by weekday',
    );
    expect(() => parseOpeningHours(null)).toThrow();
  });

  it('throws when a weekday is missing', () => {
    const raw = validRawHours();
    delete (raw as Record<string, unknown>)['sunday'];

    expect(() => parseOpeningHours(raw)).toThrow('Atelier.openingHoursJson.sunday is missing or malformed');
  });

  it('throws when a slot has a malformed time string', () => {
    const raw = validRawHours();
    raw.monday = { isOpen: true, slots: [{ open: '9am', close: '18:00' }] };

    expect(() => parseOpeningHours(raw)).toThrow('Atelier.openingHoursJson.monday is missing or malformed');
  });

  it('throws when a slot is not an object', () => {
    const raw = validRawHours();
    raw.monday = { isOpen: true, slots: ['not-an-object'] as never };

    expect(() => parseOpeningHours(raw)).toThrow('Atelier.openingHoursJson.monday is missing or malformed');
  });

  it('throws when a slot has a non-string open/close field', () => {
    const raw = validRawHours();
    raw.monday = { isOpen: true, slots: [{ open: 900, close: '18:00' }] as never };

    expect(() => parseOpeningHours(raw)).toThrow('Atelier.openingHoursJson.monday is missing or malformed');
  });

  it('throws when isOpen is not a boolean', () => {
    const raw = validRawHours();
    (raw as unknown as Record<string, unknown>)['monday'] = { isOpen: 'yes', slots: [] };

    expect(() => parseOpeningHours(raw)).toThrow();
  });
});
