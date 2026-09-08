import { isValidEmail, normalizeEmail } from '../../domain/value-objects/email.vo';

describe('email.vo', () => {
  describe('isValidEmail', () => {
    it('accepts well-formed addresses', () => {
      expect(isValidEmail('client@example.com')).toBe(true);
      expect(isValidEmail('a.b+c@sub.example.co')).toBe(true);
    });

    it('rejects malformed addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing-domain@')).toBe(false);
      expect(isValidEmail('@missing-local.com')).toBe(false);
      expect(isValidEmail('spaces in@example.com')).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(normalizeEmail('  Client@Example.COM  ')).toBe('client@example.com');
    });
  });
});
