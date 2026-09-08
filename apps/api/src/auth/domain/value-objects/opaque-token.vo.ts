import { createHash, randomBytes } from 'node:crypto';

/**
 * Refresh/password-reset tokens are opaque random strings, not JWTs — their
 * own DB row (RefreshToken/PasswordResetToken) is the sole source of truth
 * for validity/expiry/revocation, which is what makes true rotation and
 * single-use enforcement possible (a stateless JWT can't be "un-issued").
 * Only the SHA-256 hash is ever persisted; the raw token is handed to the
 * client (cookie or reset link) and never stored. `node:crypto` is a Node
 * built-in, not `@prisma/client`/`@nestjs/*` — fine to use in Domain per
 * .cursor/rules/003-nestjs-clean-arch.mdc.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashOpaqueToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
