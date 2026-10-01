import { randomBytes } from 'node:crypto';

/** Même approche que `generateQuoteNumber` : suffixe aléatoire, sans compteur atomique en base. */
export function generateCreationProjectReference(now: Date = new Date()): string {
  return `CRP-${now.getUTCFullYear()}-${randomBytes(6).toString('base64url')}`;
}
