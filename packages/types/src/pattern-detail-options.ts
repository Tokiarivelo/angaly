/**
 * Single source of truth for the pattern detail groups and their option ids (sleeves, neckline…).
 * Consumed by apps/api (validation of photo/AI values) and checked by tests against
 * apps/web `details.const.ts` and apps/ai-service `garment_knowledge.py`, which must not drift.
 * Keep one group per line, `group: ['ID', …],` — the ai-service test parses this file.
 */
export const PATTERN_DETAIL_OPTIONS = {
  manches: ['SANS_MANCHES', 'COURTES', 'TROIS_QUARTS', 'LONGUES', 'BALLON', 'PAPILLON'],
  col: ['SANS_COL', 'ROND', 'EN_V', 'BATEAU', 'CHEMISIER', 'OFFICIER', 'LAVALLIERE'],
  decollete: ['SAGE', 'MOYEN', 'PLONGEANT', 'COEUR', 'CARRE'],
  dos: ['FERME', 'DECOLLETE_V', 'DOS_NU', 'GOUTTE', 'TRANSPARENT'],
  longueur: ['MINI', 'MIDI', 'MAXI', 'SOL', 'ASYMETRIQUE'],
  fermeture: ['ZIP_INVISIBLE', 'BOUTONS', 'CEINTURE_NOUEE', 'CEINTURE_INTEGREE', 'AUCUNE'],
} as const satisfies Record<string, readonly string[]>;

export type PatternDetailGroup = keyof typeof PATTERN_DETAIL_OPTIONS;
