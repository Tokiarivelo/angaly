import { generateAppointmentReference, isValidAppointmentReference } from '../../domain/value-objects/appointment-reference.vo';

describe('generateAppointmentReference', () => {
  it('includes the UTC year of the given date', () => {
    const reference = generateAppointmentReference(new Date('2026-09-15T00:00:00.000Z'));
    expect(reference).toMatch(/^ANG-RDV-2026-/);
  });

  it('generates a value that passes isValidAppointmentReference', () => {
    expect(isValidAppointmentReference(generateAppointmentReference())).toBe(true);
  });

  it('generates different references on each call', () => {
    expect(generateAppointmentReference()).not.toBe(generateAppointmentReference());
  });
});

describe('isValidAppointmentReference', () => {
  it('rejects a predictable sequential-looking reference', () => {
    expect(isValidAppointmentReference('ANG-RDV-2026-00001')).toBe(false);
  });

  it('rejects a malformed string', () => {
    expect(isValidAppointmentReference('not-a-reference')).toBe(false);
  });
});
