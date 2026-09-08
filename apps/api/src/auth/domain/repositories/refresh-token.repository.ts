export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface IRefreshTokenRepository {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
  findByTokenHash: (tokenHash: string) => Promise<StoredRefreshToken | null>;
  /** Marks one token revoked — used on rotation (old token) and logout. */
  revoke: (id: string) => Promise<void>;
}
