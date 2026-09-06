import { CREATION_AVAILABILITIES, isCreationAvailability } from '../../domain/value-objects/availability.vo';

describe('isCreationAvailability', () => {
  it('accepts every known availability', () => {
    for (const value of CREATION_AVAILABILITIES) {
      expect(isCreationAvailability(value)).toBe(true);
    }
  });

  it('rejects an unknown value', () => {
    expect(isCreationAvailability('EN_RUPTURE')).toBe(false);
  });
});
