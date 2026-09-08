export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('IPasswordResetTokenRepository');

export interface StoredPasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface IPasswordResetTokenRepository {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
  findByTokenHash: (tokenHash: string) => Promise<StoredPasswordResetToken | null>;
  markUsed: (id: string) => Promise<void>;
}
