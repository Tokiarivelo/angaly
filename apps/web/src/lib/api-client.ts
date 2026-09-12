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

/**
 * NestJS validates the RS256 access token from `Authorization: Bearer`, not
 * a cookie — `credentials: 'include'` alone never authenticated anything
 * cross-origin (the NextAuth session cookie lives on the web app's own
 * domain, not the API's). `getSession()` is a no-op extra round trip for
 * public endpoints (returns null, header just isn't added) but is required
 * for every authenticated one — see docs/features/auth.md.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;

  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    throw new ApiError(
      errorBody.error?.message ?? 'Unexpected API error',
      response.status,
      errorBody.error?.code ?? 'UNKNOWN_ERROR',
      errorBody.error?.details,
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
  getBlob: async (path: string): Promise<Blob> => {
    const session = await getSession();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    return response.blob();
  }
};
