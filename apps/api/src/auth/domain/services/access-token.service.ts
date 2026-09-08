import type { UserRole } from '../entities/user.entity';

export const ACCESS_TOKEN_SERVICE = Symbol('IAccessTokenService');

/** Minimal payload (ADR-001 / docs/features/auth.md) — never anything sensitive. */
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface IAccessTokenService {
  sign: (payload: AccessTokenPayload) => string;
  /** Returns null on any verification failure (expired, bad signature, malformed) — never throws. */
  verify: (token: string) => AccessTokenPayload | null;
}
