import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@angaly/types';
import { apiClient, ApiError } from '../api-client';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
  getCsrfToken: vi.fn().mockResolvedValue('mock-csrf-token'),
}));

import { getSession } from 'next-auth/react';

import type { Session } from 'next-auth';

const mockGetSession = vi.mocked(getSession);

function createMockJwt(expInSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expInSecondsFromNow;
  const payload = btoa(JSON.stringify({ sub: 'user-1', role: Role.CLIENT, exp }));
  return `${header}.${payload}.signature`;
}

function buildMockSession(accessToken: string): Session {
  return {
    user: {
      id: 'user-1',
      email: 'test@angaly.mg',
      role: Role.CLIENT,
      accessToken,
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      refreshToken: 'mock-refresh-token',
    },
    accessToken,
    expires: '2099-01-01',
  };
}

describe('apiClient auto-refresh token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should include valid Bearer token in request headers', async () => {
    const validToken = createMockJwt(3600); // 1 hour validity
    mockGetSession.mockResolvedValue(buildMockSession(validToken));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: { message: 'hello' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient.get<{ message: string }>('/api/test');

    expect(result).toEqual({ message: 'hello' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const firstCall = mockFetch.mock.calls[0];
    expect(firstCall).toBeDefined();
    const headers = firstCall![1].headers as Headers;
    expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`);
  });

  it('should proactively refresh token when token is near expiry or expired', async () => {
    const expiredToken = createMockJwt(-100); // Expired 100s ago
    const freshToken = createMockJwt(3600); // New valid token

    mockGetSession
      .mockResolvedValueOnce(buildMockSession(expiredToken))
      .mockResolvedValue(buildMockSession(freshToken));

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/csrf')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'csrf-123' }),
        });
      }
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: freshToken }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { success: true } }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient.post('/api/pattern-projects', { garmentType: 'ROBE' });

    expect(result).toEqual({ success: true });
    // The main API call should have been made with the fresh token
    const apiCalls = mockFetch.mock.calls.filter(([url]) => url.includes('/api/pattern-projects'));
    expect(apiCalls.length).toBe(1);
    const headers = apiCalls[0]![1].headers as Headers;
    expect(headers.get('Authorization')).toBe(`Bearer ${freshToken}`);
  });

  it('should automatically refresh and retry when receiving a 401 response', async () => {
    const initialToken = createMockJwt(3600);
    const freshToken = createMockJwt(7200);

    mockGetSession.mockResolvedValue(buildMockSession(initialToken));

    let apiCallCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/csrf')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'csrf-123' }),
        });
      }
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: freshToken }),
        });
      }
      if (url.includes('/api/pattern-projects')) {
        apiCallCount++;
        if (apiCallCount === 1) {
          // First call: 401 Unauthorized
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                success: false,
                statusCode: 401,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' },
              }),
          });
        }
        // Second call (retry): 200 OK
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: { id: 'project-123', garmentType: 'ROBE' },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient.post<{ id: string; garmentType: string }>('/api/pattern-projects', {
      garmentType: 'ROBE',
    });

    expect(result).toEqual({ id: 'project-123', garmentType: 'ROBE' });
    expect(apiCallCount).toBe(2);
  });

  it('should coalesce multiple concurrent 401s into a single refresh request', async () => {
    const initialToken = createMockJwt(3600);
    const freshToken = createMockJwt(7200);

    mockGetSession.mockResolvedValue(buildMockSession(initialToken));

    let refreshCallCount = 0;
    let apiCallCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/csrf')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'csrf-123' }),
        });
      }
      if (url.includes('/api/auth/session')) {
        refreshCallCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: freshToken }),
        });
      }
      if (url.includes('/api/concurrent')) {
        apiCallCount++;
        // If using initial token, fail with 401
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { ok: true } }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal('fetch', mockFetch);

    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/api/concurrent-1'),
      apiClient.get('/api/concurrent-2'),
      apiClient.get('/api/concurrent-3'),
    ]);

    expect(res1).toEqual({ ok: true });
    expect(res2).toEqual({ ok: true });
    expect(res3).toEqual({ ok: true });
  });

  it('should throw ApiError if retry also fails with 401', async () => {
    const initialToken = createMockJwt(3600);
    const freshToken = createMockJwt(7200);

    mockGetSession.mockResolvedValue(buildMockSession(initialToken));

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ accessToken: freshToken }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            success: false,
            statusCode: 401,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized permanently' },
          }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(apiClient.get('/api/protected')).rejects.toThrow(ApiError);
  });
});
