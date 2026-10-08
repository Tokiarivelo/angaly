import type {
  ConstructionApproach,
  GarmentProfile,
  PatternExtParameters,
} from '@angaly/types';

export interface ApproachDecision {
  approach: ConstructionApproach;
  reason: string;
}

/**
 * Decision tree (Phase 5b S5). Pure and deterministic — the photo's construction method wins over
 * everything the engine could do, because a free drape cannot be traced flat:
 *
 * | construction method (photo) | drape blocks applied | approach                     |
 * |-----------------------------|----------------------|------------------------------|
 * | DRAPING                     | any                  | MANNEQUIN_ONLY               |
 * | MIXED                       | any                  | FLAT_BASE_PLUS_MANNEQUIN     |
 * | FLAT_PATTERN / unknown      | yes                  | FLAT_WITH_BLOCKS             |
 * | FLAT_PATTERN / unknown      | no                   | FLAT_FULL                    |
 */
export function decideConstructionApproach(
  profile: GarmentProfile | null | undefined,
  ext: PatternExtParameters | null | undefined,
): ApproachDecision {
  const method = profile?.isGarment ? (profile.constructionMethod ?? 'FLAT_PATTERN') : 'FLAT_PATTERN';
  const hasBlocks = (ext?.drape?.blocks.length ?? 0) > 0;

  if (method === 'DRAPING') {
    return {
      approach: 'MANNEQUIN_ONLY',
      reason:
        'Drapé libre : le tissu se façonne directement sur mannequin ; le patron à plat se limite à la doublure / au bloc de base.',
    };
  }
  if (method === 'MIXED') {
    return {
      approach: 'FLAT_BASE_PLUS_MANNEQUIN',
      reason: hasBlocks
        ? 'Base ajustée et parties régulières tracées à plat (blocs de drapé) ; la partie libre se moule sur mannequin.'
        : 'Base ajustée tracée à plat ; la partie drapée libre se moule sur mannequin.',
    };
  }
  if (hasBlocks) {
    return {
      approach: 'FLAT_WITH_BLOCKS',
      reason: 'Drapé régulier (fronces, plis, cercle, portefeuille…) construit à plat avec des blocs de drapé.',
    };
  }
  return { approach: 'FLAT_FULL', reason: 'Vêtement structuré : patron à plat complet.' };
}
