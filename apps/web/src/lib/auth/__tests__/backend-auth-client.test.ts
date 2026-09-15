import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { API_INTERNAL_URL: 'http://api.internal.test' },
}));

import { refreshWithBackend } from '../backend-auth-client';
import { InvalidRefreshTokenError } from '../invalid-refresh-token-error';

describe('refreshWithBackend', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns the new session on success', async () => {
    const accessToken = `${btoa('{}')}.${btoa(JSON.stringify({ exp: 9999999999 }))}.sig`;
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'set-cookie': 'refresh_token=new-token; HttpOnly; Path=/' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { accessToken, user: { id: 'u1', email: 'a@b.com', role: 'CLIENT' } },
        }),
    });

    const result = await refreshWithBackend('old-token');

    expect(result.refreshToken).toBe('new-token');
    expect(result.accessToken).toBe(accessToken);
  });

  it('throws InvalidRefreshTokenError on a 401 — the only case that should log the user out', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: () =>
        Promise.resolve({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' },
        }),
    });

    await expect(refreshWithBackend('dead-token')).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('throws a plain Error (not InvalidRefreshTokenError) on a 500 — a transient backend problem', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: () =>
        Promise.resolve({ success: false, error: { code: 'INTERNAL', message: 'Boom' } }),
    });

    const rejection = refreshWithBackend('some-token');
    await expect(rejection).rejects.toThrow();
    await expect(rejection).rejects.not.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('throws a plain Error (not InvalidRefreshTokenError) when fetch itself fails — a network blip', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const rejection = refreshWithBackend('some-token');
    await expect(rejection).rejects.toThrow();
    await expect(rejection).rejects.not.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
