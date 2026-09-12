import { getSession } from 'next-auth/react';

/**
 * The only place allowed to call `fetch` against the ANGALY API. Every
 * feature's `api/` folder (react-query queries/mutations) goes through this —
 * never `fetch`/`axios` directly in a hook or component (.cursor/rules/002-nextjs-features.mdc).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
  statusCode: number;
}

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3003/api';

function buildUrl(path: string): string {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/api/')
    ? path.slice(4)
    : path === '/api'
      ? ''
      : path;
  return `${cleanBase}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
}

function decodeAccessTokenExpiry(accessToken: string): number | null {
  try {
    const payloadSegment = accessToken.split('.')[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = decodeAccessTokenExpiry(token);
  if (!exp) return false;
  return exp - Math.floor(Date.now() / 1000) <= bufferSeconds;
}

let activeRefreshPromise: Promise<string | null> | null = null;

/**
 * Mutexed token refresher.
 * When multiple requests trigger a refresh concurrently, they all await
 * the same in-flight refresh to preserve refresh token rotation.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      if (typeof window !== 'undefined') {
        // Attempt 1: NextAuth session update with CSRF to force jwt update
        try {
          const csrfRes = await fetch('/api/auth/csrf', { cache: 'no-store' });
          if (csrfRes.ok) {
            const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
            if (csrfToken) {
              const updateRes = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csrfToken, data: { forceRefresh: true } }),
                cache: 'no-store',
              });
              if (updateRes.ok) {
                const updatedSession = (await updateRes.json()) as { accessToken?: string; error?: string } | null;
                if (updatedSession?.accessToken && !updatedSession.error) {
                  return updatedSession.accessToken;
                }
              }
            }
          }
        } catch {
          // Fall through to GET /api/auth/session
        }

        // Attempt 2: Direct un-cached GET to /api/auth/session
        try {
          const res = await fetch('/api/auth/session', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (res.ok) {
            const freshSession = (await res.json()) as { accessToken?: string; error?: string } | null;
            if (freshSession?.accessToken && !freshSession.error) {
              return freshSession.accessToken;
            }
          }
        } catch {
          // Fall through
        }
      }

      // Attempt 3: Client-side getSession()
      const session = await getSession();
      if (session?.accessToken && !session.error) {
        return session.accessToken;
      }

      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

async function getValidAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (session?.error === 'RefreshAccessTokenError') {
    return null;
  }

  const token = session?.accessToken ?? null;
  if (!token) {
    return null;
  }

  // If token is already expired or near expiry (< 30s), refresh proactively
  if (isTokenExpired(token)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return refreshed;
    }
    // If the token has genuinely expired (exp <= now) and refresh failed, do not send it
    if (isTokenExpired(token, 0)) {
      return null;
    }
  }

  return token;
}

/**
 * NestJS validates the RS256 access token from `Authorization: Bearer`, not
 * a cookie — `credentials: 'include'` alone never authenticated anything
 * cross-origin (the NextAuth session cookie lives on the web app's own
 * domain, not the API's).
 */
async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const token = await getValidAccessToken();

  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.method !== 'GET' && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });

  // Reactive auto-refresh: On 401 Unauthorized, refresh the token and retry ONCE
  if (response.status === 401 && !isRetry) {
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      const retryHeaders = new Headers(init?.headers);
      if (!retryHeaders.has('Content-Type') && init?.method !== 'GET' && !(init?.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${freshToken}`);

      return request<T>(path, { ...init, headers: retryHeaders }, true);
    }
  }

  let body: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    body = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  } catch {
    // Non-JSON response
  }

  if (!response.ok || !body || !('success' in body) || !body.success) {
    const errorBody = body as ApiErrorEnvelope | null;
    throw new ApiError(
      errorBody?.error?.message ?? response.statusText ?? 'Unexpected API error',
      response.status,
      errorBody?.error?.code ?? 'UNKNOWN_ERROR',
      errorBody?.error?.details,
    );
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', ...(body !== undefined && { body: JSON.stringify(body) }) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getBlob: async (path: string, isRetry = false): Promise<Blob> => {
    const token = await getValidAccessToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (response.status === 401 && !isRetry) {
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        return apiClient.getBlob(path, true);
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    return response.blob();
  },
};
