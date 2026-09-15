import { describe, it, expect, vi } from 'vitest';
import type { JWT } from 'next-auth/jwt';

import { maybeRefreshToken } from '../refresh-jwt';
import { InvalidRefreshTokenError } from '../invalid-refresh-token-error';

function makeToken(overrides: Partial<JWT> = {}): JWT {
  return {
    accessToken: 'old-access-token',
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600, // far from expiry by default
    refreshToken: 'old-refresh-token',
    userId: 'user-1',
    ...overrides,
  } as JWT;
}

describe('maybeRefreshToken', () => {
  it('does nothing when the token is not near expiry and no force refresh was requested', async () => {
    const token = makeToken();
    const refresh = vi.fn();

    const result = await maybeRefreshToken(token, false, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('old-access-token');
  });

  it('refreshes when the access token is near expiry', async () => {
    const token = makeToken({ accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 10 });
    const refresh = vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 900,
      refreshToken: 'new-refresh-token',
    });

    const result = await maybeRefreshToken(token, false, refresh);

    expect(refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.error).toBeUndefined();
  });

  it('refreshes even when not near expiry if forceRefresh is requested', async () => {
    const token = makeToken();
    const refresh = vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 900,
      refreshToken: 'new-refresh-token',
    });

    await maybeRefreshToken(token, true, refresh);

    expect(refresh).toHaveBeenCalled();
  });

  it('does nothing when there is no refresh token to use, even near expiry', async () => {
    const token = makeToken({ accessTokenExpiresAt: 0, refreshToken: undefined });
    const refresh = vi.fn();

    await maybeRefreshToken(token, false, refresh);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('KEEPS the existing token/refreshToken on a transient failure (not InvalidRefreshTokenError) — regression test for spurious logouts', async () => {
    const token = makeToken({ accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 10 });
    const refresh = vi.fn().mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

    const result = await maybeRefreshToken(token, false, refresh);

    expect(result.error).toBeUndefined();
    expect(result.accessToken).toBe('old-access-token');
    expect(result.refreshToken).toBe('old-refresh-token');
    expect(result.userId).toBe('user-1');
  });

  it('CLEARS the session only when the refresh token is confirmed dead (InvalidRefreshTokenError)', async () => {
    const token = makeToken({ accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 10 });
    const refresh = vi.fn().mockRejectedValue(new InvalidRefreshTokenError('Invalid or expired refresh token'));

    const result = await maybeRefreshToken(token, false, refresh);

    expect(result.error).toBe('RefreshAccessTokenError');
    expect(result.accessToken).toBeUndefined();
    expect(result.refreshToken).toBeUndefined();
    expect(result.userId).toBeUndefined();
    expect(result.role).toBeUndefined();
  });
});
