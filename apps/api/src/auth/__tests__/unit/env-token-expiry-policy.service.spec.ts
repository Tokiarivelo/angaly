import type { ConfigService } from '@nestjs/config';

import { EnvTokenExpiryPolicy, parseDurationToMs } from '../../infrastructure/services/env-token-expiry-policy.service';

describe('parseDurationToMs', () => {
  it('parses seconds/minutes/hours/days', () => {
    expect(parseDurationToMs('30s')).toBe(30_000);
    expect(parseDurationToMs('15m')).toBe(15 * 60_000);
    expect(parseDurationToMs('2h')).toBe(2 * 3_600_000);
    expect(parseDurationToMs('7d')).toBe(7 * 86_400_000);
  });

  it('throws on an invalid format', () => {
    expect(() => parseDurationToMs('7')).toThrow(/Invalid duration format/);
    expect(() => parseDurationToMs('7 days')).toThrow(/Invalid duration format/);
    expect(() => parseDurationToMs('d7')).toThrow(/Invalid duration format/);
  });
});

describe('EnvTokenExpiryPolicy', () => {
  function buildConfig(value: string | undefined): jest.Mocked<ConfigService> {
    return { get: jest.fn().mockReturnValue(value) } as unknown as jest.Mocked<ConfigService>;
  }

  it('computes refreshTokenExpiresAt from JWT_REFRESH_TOKEN_EXPIRES_IN', () => {
    const policy = new EnvTokenExpiryPolicy(buildConfig('7d'));
    const before = Date.now();

    const expiresAt = policy.refreshTokenExpiresAt();

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * 86_400_000 - 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 7 * 86_400_000 + 1000);
  });

  it('defaults to 7d when the env var is unset', () => {
    const policy = new EnvTokenExpiryPolicy(buildConfig(undefined));
    const expiresAt = policy.refreshTokenExpiresAt();

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000);
  });

  it('computes passwordResetTokenExpiresAt as a fixed 1h window', () => {
    const policy = new EnvTokenExpiryPolicy(buildConfig(undefined));
    const before = Date.now();

    const expiresAt = policy.passwordResetTokenExpiresAt();

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3_600_000 - 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 3_600_000 + 1000);
  });
});
