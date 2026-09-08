const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

/** Case-insensitive per RFC convention for the mailbox comparison used everywhere in this codebase. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
