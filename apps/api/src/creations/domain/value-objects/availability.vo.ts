/**
 * Domain-local mirror of `CreationAvailability` (`@angaly/types` / `schema.prisma`).
 * Duplicated on purpose: the Domain layer must not import `@angaly/types`
 * (see .cursor/rules/003-nestjs-clean-arch.mdc) — keep both enums in sync by hand.
 */
export const CREATION_AVAILABILITIES = ['DISPONIBLE', 'SUR_DEMANDE', 'PIECE_UNIQUE'] as const;

export type CreationAvailability = (typeof CREATION_AVAILABILITIES)[number];

export function isCreationAvailability(value: string): value is CreationAvailability {
  return (CREATION_AVAILABILITIES as readonly string[]).includes(value);
}
