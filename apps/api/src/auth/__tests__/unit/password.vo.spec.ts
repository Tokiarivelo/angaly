import { isValidPassword, MIN_PASSWORD_LENGTH } from '../../domain/value-objects/password.vo';

describe('isValidPassword', () => {
  it('rejects passwords shorter than the minimum length', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
  });

  it('accepts passwords at or above the minimum length', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true);
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH + 5))).toBe(true);
  });
});
