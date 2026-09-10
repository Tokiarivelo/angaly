/** Mirrors apps/api/src/auth/domain/value-objects/password.vo.ts MIN_PASSWORD_LENGTH. */
export const MIN_PASSWORD_LENGTH = 8;

/** Query-string param carrying the page to return to after login (see docs/pages/authentification.md). */
export const REDIRECT_TO_PARAM = 'redirectTo';

export const QUERY_KEYS = { all: ['authentification'] as const };
