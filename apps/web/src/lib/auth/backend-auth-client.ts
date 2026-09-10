/**
 * Server-only bridge to apps/api's `auth` module, used exclusively by NextAuth's
 * Credentials `authorize()` and its `jwt` callback (see ./auth.ts). Calls
 * `API_INTERNAL_URL` directly rather than the public reverse-proxy path — in
 * production `/api/auth/*` is routed to this Next.js app for NextAuth's own
 * routes (see docker/nginx/conf.d/angaly.conf, docker/caddy/Caddyfile), so a
 * self-referential call over the public path would loop back here instead of
 * reaching apps/api.
 *
 * The refresh token is never in the JSON body (see AuthTokensDto in
 * @angaly/types) — apps/api hands it back only as an httpOnly `Set-Cookie`.
 * Since this module calls apps/api server-to-server, that cookie would
 * otherwise be dropped; it's parsed out here and threaded through NextAuth's
 * own encrypted session JWT instead (see ./auth.ts's `jwt` callback).
 */
import type { AuthTokensDto } from '@angaly/types';

import { env } from '@/lib/env';

interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
  statusCode: number;
}

export interface BackendSession {
  accessToken: string;
  /** Epoch seconds, decoded from the access token's own `exp` claim (RS256, not re-verified here — apps/api re-verifies on every request). */
  accessTokenExpiresAt: number;
  refreshToken: string;
  user: AuthTokensDto['user'];
}

const REFRESH_TOKEN_COOKIE = 'refresh_token';

function decodeAccessTokenExpiry(accessToken: string): number {
  const payloadSegment = accessToken.split('.')[1];
  if (!payloadSegment) {
    return Math.floor(Date.now() / 1000);
  }
  const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as { exp?: number };
  return payload.exp ?? Math.floor(Date.now() / 1000);
}

/** Only one Set-Cookie header is ever sent by apps/api's auth endpoints, so a plain `.get()` (no getSetCookie() dependency) is safe. */
function extractRefreshToken(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null;
  }
  const match = /(?:^|,\s*)refresh_token=([^;]+)/.exec(setCookieHeader);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function callBackend(path: string, body: unknown, cookieHeader?: string): Promise<BackendSession> {
  const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const json = (await response.json()) as ApiSuccessEnvelope<AuthTokensDto> | ApiErrorEnvelope;

  if (!response.ok || !json.success) {
    throw new Error(!json.success ? json.error.message : 'Erreur inattendue du serveur.');
  }

  const refreshToken = extractRefreshToken(response.headers.get('set-cookie'));
  if (!refreshToken) {
    throw new Error('Le serveur n’a pas renvoyé de jeton de rafraîchissement.');
  }

  return {
    accessToken: json.data.accessToken,
    accessTokenExpiresAt: decodeAccessTokenExpiry(json.data.accessToken),
    refreshToken,
    user: json.data.user,
  };
}

export function loginWithBackend(email: string, password: string): Promise<BackendSession> {
  return callBackend('/auth/login', { email, password });
}

export function registerWithBackend(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<BackendSession> {
  return callBackend('/auth/register', input);
}

export function refreshWithBackend(refreshToken: string): Promise<BackendSession> {
  return callBackend('/auth/refresh', undefined, `${REFRESH_TOKEN_COOKIE}=${refreshToken}`);
}

export async function logoutWithBackend(accessToken: string, refreshToken: string): Promise<void> {
  await fetch(`${env.API_INTERNAL_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
    },
  });
}
