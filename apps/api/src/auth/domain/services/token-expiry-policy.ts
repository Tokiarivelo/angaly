export const TOKEN_EXPIRY_POLICY = Symbol('ITokenExpiryPolicy');

/**
 * How long refresh/password-reset tokens live before expiring — kept behind
 * an interface (rather than use-cases reading `ConfigService`/`process.env`
 * directly) so use-cases only ever depend on Domain-defined ports, per
 * .cursor/rules/003-nestjs-clean-arch.mdc.
 */
export interface ITokenExpiryPolicy {
  refreshTokenExpiresAt: () => Date;
  passwordResetTokenExpiresAt: () => Date;
}
