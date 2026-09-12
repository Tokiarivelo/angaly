import { randomBytes } from 'node:crypto';

export function generatePatternProjectRef(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `ANG-PAT-${year}-${suffix}`;
}

export function isValidPatternProjectRef(value: string): boolean {
  return /^ANG-PAT-\d{4}-[A-Z0-9]{8}$/.test(value);
}
