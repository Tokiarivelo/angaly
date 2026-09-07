import { CreationAvailability } from '@angaly/types';

/** Real Stitch screen's "Confection" spec row describes a fixed narrative ("120 heures de
 * travail") with no backing Prisma field — replaced by the real `availability` enum instead,
 * same honesty tradeoff as docs/pages/nos-creations-galerie.md's decorative filters. */
export const AVAILABILITY_LABELS: Record<CreationAvailability, string> = {
  [CreationAvailability.DISPONIBLE]: 'Disponible',
  [CreationAvailability.SUR_DEMANDE]: 'Sur demande',
  [CreationAvailability.PIECE_UNIQUE]: 'Pièce unique',
};
