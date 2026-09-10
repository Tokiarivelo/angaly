import { describe, expect, it } from 'vitest';

import { signupSchema } from '../schemas/signup.schema';

const VALID_VALUES = {
  firstName: 'Nirina',
  lastName: 'Rakoto',
  email: 'nirina@example.com',
  phone: '+261 34 12 345 67',
  password: 'password123',
  confirmPassword: 'password123',
  acceptTerms: true,
};

describe('signupSchema', () => {
  it('accepts fully valid values', () => {
    expect(signupSchema.safeParse(VALID_VALUES).success).toBe(true);
  });

  it('rejects mismatched password confirmation', () => {
    const result = signupSchema.safeParse({ ...VALID_VALUES, confirmPassword: 'somethingElse' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordIssue = result.error.issues.find((issue) => issue.path.includes('confirmPassword'));
      expect(confirmPasswordIssue?.message).toBe('Les mots de passe ne correspondent pas');
    }
  });

  it('rejects an unchecked acceptTerms', () => {
    const result = signupSchema.safeParse({ ...VALID_VALUES, acceptTerms: false });

    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than MIN_PASSWORD_LENGTH', () => {
    const result = signupSchema.safeParse({ ...VALID_VALUES, password: 'short', confirmPassword: 'short' });

    expect(result.success).toBe(false);
  });

  it('accepts a missing phone — verified against the real Stitch markup (only field without `required`) and RegisterDto.phone?', () => {
    const { phone: _phone, ...withoutPhone } = VALID_VALUES;

    expect(signupSchema.safeParse(withoutPhone).success).toBe(true);
  });
});
