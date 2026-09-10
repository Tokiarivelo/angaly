import { randomBytes } from 'node:crypto';

/**
 * `get-appointment-by-reference`/`cancel-appointment` are reachable by
 * reference alone, with no authentication (a signed-out visitor must be
 * able to manage the appointment they just booked — see
 * docs/features/appointments.md "Points d'attention"). The random suffix
 * (not a predictable sequence) is what makes that safe: `node:crypto`, no
 * new dependency, same choice already made for auth's opaque tokens.
 */
const REFERENCE_PATTERN = /^ANG-RDV-\d{4}-[A-Za-z0-9_-]{8}$/;

export function generateAppointmentReference(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = randomBytes(6).toString('base64url');
  return `ANG-RDV-${year}-${suffix}`;
}

export function isValidAppointmentReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}
