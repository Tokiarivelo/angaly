/**
 * Thrown only when apps/api explicitly rejected a refresh token (401 —
 * `RefreshAccessTokenUseCase` found it missing/expired/revoked-past-grace).
 * Kept in its own module (no other imports) so it can be used by
 * `refresh-jwt.ts` without pulling in `@/lib/env` (which throws at import
 * time outside a fully-configured runtime, e.g. in unit tests).
 */
export class InvalidRefreshTokenError extends Error {}
