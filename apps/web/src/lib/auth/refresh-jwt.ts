import type { JWT } from 'next-auth/jwt';

import { InvalidRefreshTokenError } from './invalid-refresh-token-error';

/** Refresh once the access token is within this many seconds of expiring. */
export const REFRESH_BUFFER_SECONDS = 60;

export interface RefreshedTokens {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
}

/**
 * Decides whether the JWT needs refreshing and, if so, attempts it — mutating
 * and returning `token` either way, matching NextAuth's `jwt` callback
 * contract. Extracted from `auth.ts` so it's testable without importing
 * `next-auth`'s factory or `@/lib/env` (see `current-user.decorator.ts` for
 * the same pattern elsewhere in this codebase).
 *
 * Only a confirmed-dead refresh token (`InvalidRefreshTokenError`, i.e. a 401
 * from apps/api) clears the session. Any other failure — a network blip,
 * apps/api mid-restart, a dropped response — is transient: the existing
 * `accessToken`/`refreshToken` are left untouched so the *next* request can
 * retry with the still-valid refresh token, instead of permanently logging
 * the user out over what was often just a momentary hiccup.
 */
export async function maybeRefreshToken(
  token: JWT,
  isForceRefresh: boolean,
  refresh: (refreshToken: string) => Promise<RefreshedTokens>,
): Promise<JWT> {
  const expiresAt = token.accessTokenExpiresAt ?? 0;
  const isNearExpiry = expiresAt - Math.floor(Date.now() / 1000) < REFRESH_BUFFER_SECONDS;

  if ((!isNearExpiry && !isForceRefresh) || !token.refreshToken) {
    return token;
  }

  try {
    const refreshed = await refresh(token.refreshToken);
    token.accessToken = refreshed.accessToken;
    token.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    token.refreshToken = refreshed.refreshToken;
    delete token.error;
  } catch (error) {
    if (error instanceof InvalidRefreshTokenError) {
      token.error = 'RefreshAccessTokenError';
      delete token.accessToken;
      delete token.accessTokenExpiresAt;
      delete token.refreshToken;
      delete token.userId;
      delete token.role;
    }
  }

  return token;
}
