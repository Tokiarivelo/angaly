import { generateOpaqueToken, hashOpaqueToken } from '../../domain/value-objects/opaque-token.vo';

describe('opaque-token.vo', () => {
  it('generates a 64-char hex token (32 random bytes)', () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates a different token on each call', () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
  });

  it('hashes deterministically (same input → same hash)', () => {
    const token = generateOpaqueToken();
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
  });

  it('produces a different hash for a different token', () => {
    expect(hashOpaqueToken(generateOpaqueToken())).not.toBe(hashOpaqueToken(generateOpaqueToken()));
  });

  it('never returns the raw token as its own hash', () => {
    const token = generateOpaqueToken();
    expect(hashOpaqueToken(token)).not.toBe(token);
  });
});
