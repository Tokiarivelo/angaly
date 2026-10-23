/**
 * Single source of truth for the pattern detail groups and their option ids (sleeves, neckline…).
 * Consumed by apps/api (validation of photo/AI values) and checked by tests against
 * apps/web `details.const.ts` and apps/ai-service `garment_knowledge.py`, which must not drift.
 * Keep one group per line, `group: ['ID', …],` — the ai-service test parses this file.
 */
export const PATTERN_DETAIL_OPTIONS = {
  manches: ['SANS_MANCHES', 'COURTES', 'TROIS_QUARTS', 'LONGUES', 'BALLON', 'PAPILLON', 'EVEQUE', 'CLOCHE', 'LANTERNE', 'RAGLAN', 'KIMONO', 'CAP', 'TAILLEUR'],
  col: ['SANS_COL', 'ROND', 'EN_V', 'BATEAU', 'CHEMISIER', 'OFFICIER', 'LAVALLIERE', 'CHALE'],
  decollete: ['SAGE', 'MOYEN', 'PLONGEANT', 'COEUR', 'CARRE', 'EN_U', 'HORS_EPAULES'],
  dos: ['FERME', 'DECOLLETE_V', 'DOS_NU', 'GOUTTE', 'TRANSPARENT'],
  longueur: ['MINI', 'GENOU', 'MIDI', 'MAXI', 'SOL', 'ASYMETRIQUE'],
  fermeture: ['ZIP_INVISIBLE', 'BOUTONS', 'CEINTURE_NOUEE', 'CEINTURE_INTEGREE', 'AUCUNE', 'CORDELIERE', 'ZIP_DEVANT', 'BOUTONS_TAILLE', 'BRAGUETTE_ZIP', 'BRAGUETTE_BOUTONS', 'ZIP_COTE', 'ELASTIQUE'],
  corsage: ['LISSE', 'FRONCES_SOUS_POITRINE', 'CROISE_FRONCE', 'BALEINE', 'PRINCESSE'],
  taille: ['NATURELLE', 'BASSE', 'HAUTE', 'POINTE'],
  devant: ['FERME', 'MANTEAU_OUVERT', 'MANTEAU_REVERS', 'GILET'],
  jupe: ['DEUX_PANS', 'EN_LES'],
  basque: ['AUCUNE', 'POINTES', 'PANS_CROISES'],
  ceinture: ['DROITE', 'FORMEE', 'ELASTIQUEE', 'COULISSE', 'SANS'],
  plis: ['AUCUN', 'PINCES', 'UN_PLI', 'DEUX_PLIS'],
  poches: ['AUCUNE', 'ITALIENNES', 'COUTURE', 'PLAQUEES'],
  poches_dos: ['AUCUNE', 'PASSEPOIL', 'PLAQUEES'],
  bas: ['OURLET', 'REVERS'],
  fente: ['AUCUNE', 'DOS', 'COTE'],
} as const satisfies Record<string, readonly string[]>;

export type PatternDetailGroup = keyof typeof PATTERN_DETAIL_OPTIONS;
