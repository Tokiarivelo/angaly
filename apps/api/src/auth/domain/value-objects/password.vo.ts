/**
 * No explicit complexity rule in stitch-prompts/29-connexion-inscription.md
 * or spec §82 beyond the field itself — a plain minimum length is the least
 * surprising default until product asks for more (uppercase/digit/symbol
 * rules), see docs/features/auth.md.
 */
export const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}
