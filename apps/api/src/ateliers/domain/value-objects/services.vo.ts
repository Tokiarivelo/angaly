/** Parses `Atelier.servicesJson` (nullable, untyped Prisma Json column) leniently — unlike opening hours, a malformed entry is dropped rather than fatal. */
export function parseServices(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is string => typeof item === 'string');
}
