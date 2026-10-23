import { Injectable } from '@nestjs/common';
import {
  detailGroupsForGarment,
  listPatternExtKeys,
  mergePatternExtParameters,
  type GarmentProfile,
  type InspirationAnalysisSnapshot,
  type PatternExtKey,
  type PatternExtParameters,
} from '@angaly/types';
import {
  PATTERN_DETAIL_OPTIONS,
  isValidPatternDetail,
} from '../../domain/constants/pattern-detail-options';

/** Collars whose shape already fixes the neckline (a depth class on top would flatten them). */
const SHAPED_COLLARS = new Set(['EN_V', 'BATEAU', 'OFFICIER', 'CHEMISIER', 'LAVALLIERE']);

export interface MergedParameters {
  cutType: string;
  details: Record<string, string>;
  /** Detail groups taken from the photo analysis because the customer left them empty. */
  fromPhotoKeys: string[];
  /** Ease / fullness / lengths, validated: customer's choices first, then what the photo suggests. */
  ext: PatternExtParameters;
  /** Extended keys (`ease`, `fullness.skirt`…) that came from the photo. */
  extKeysFromPhoto: PatternExtKey[];
}

export interface DrapingAdvice {
  method: 'DRAPING' | 'MIXED';
  notes: string | null;
  warning: string;
}

/**
 * Turns a stored photo analysis into the best possible engine parameters. The customer's own
 * confirmed choices always win; the photo only fills the gaps, and only with values the engine knows.
 * Pure and deterministic — geometry itself still comes only from packages/pattern-engine (ADR-005).
 */
/** `col` values that add a collar piece (the others are necklines, or no collar). */
const COLLAR_PIECES = new Set(['CHEMISIER', 'OFFICIER', 'LAVALLIERE', 'CHALE']);
/** `col` values that set the neckline's depth themselves: no `decollete` is suggested on top of them. */
const OWN_NECKLINE = new Set([...COLLAR_PIECES, 'BATEAU']);

@Injectable()
export class InspirationParametersService {
  merge(
    project: {
      cutType: string | null;
      details: Record<string, string>;
      parametersExt?: PatternExtParameters | null;
    },
    analysis: InspirationAnalysisSnapshot | null,
  ): MergedParameters {
    const profile = analysis?.profile;
    const details = { ...project.details };
    const fromPhotoKeys: string[] = [];

    if (profile?.isGarment) {
      for (const [group, value] of Object.entries(profile.details)) {
        if (details[group] || !isValidPatternDetail(group, value)) continue;
        details[group] = value;
        fromPhotoKeys.push(group);
      }
      // A shaped collar (V, boat, mandarin…) and a depth class describe the same neckline, and the engine lets
      // the depth class win: when the photo gave both, keep the shape the reader actually named.
      const col = profile.details['col'];
      // Off the shoulders is the exception: the edge runs below the shoulders, it is the whole neckline.
      if (col && SHAPED_COLLARS.has(col) && fromPhotoKeys.includes('col') && fromPhotoKeys.includes('decollete')) {
        const drop = details['decollete'] === 'HORS_EPAULES' ? 'col' : 'decollete';
        delete details[drop];
        fromPhotoKeys.splice(fromPhotoKeys.indexOf(drop), 1);
      }
    }

    // Per key: the customer's explicit choice wins, the photo only fills what is still empty.
    // Both sources are re-validated (bounds, types): an invalid value is skipped, never clamped.
    // A free drape (DRAPING) never gets deterministic blocks: they cannot replace a mannequin moulding.
    const photoBlocks =
      profile?.isGarment && profile.constructionMethod !== 'DRAPING' ? (profile.drapeBlocks ?? []) : [];
    const photoTrims = profile?.isGarment ? (profile.trims ?? []) : [];
    const photoConstruction = profile?.isGarment ? (profile.construction ?? []) : [];
    const photoFit = profile?.isGarment
      ? {
          ...profile.fit,
          ...(photoBlocks.length > 0 ? { drape: { blocks: photoBlocks } } : {}),
          ...(photoTrims.length > 0 ? { trims: { items: photoTrims } } : {}),
          ...(photoConstruction.length > 0 ? { construction: { items: photoConstruction } } : {}),
        }
      : null;
    const { value: ext, origin } = mergePatternExtParameters(project.parametersExt, photoFit);
    const extKeysFromPhoto = listPatternExtKeys(ext).filter((key) => origin[key] === 1);

    return {
      cutType: project.cutType ?? (profile?.isGarment ? profile.cutType : null) ?? 'DROITE',
      details,
      fromPhotoKeys,
      ext,
      extKeysFromPhoto,
    };
  }

  /** Detail groups of this garment still empty after the merge — candidates for an AI suggestion. */
  missingGroups(details: Record<string, string>, garmentType?: string | null): string[] {
    const groups: readonly string[] = garmentType ? detailGroupsForGarment(garmentType) : Object.keys(PATTERN_DETAIL_OPTIONS);
    return groups.filter((group) => !details[group]);
  }

  /** Keeps only valid, non-overriding values from an AI suggestion. */
  acceptSuggestedDetails(
    current: Record<string, string>,
    suggested: Record<string, string>,
    garmentType?: string | null,
  ): { details: Record<string, string>; acceptedKeys: string[] } {
    const details = { ...current };
    const acceptedKeys: string[] = [];
    // A group the garment does not take (pockets on a dress, a collar on trousers) is never filled in.
    const groups = garmentType ? new Set<string>(detailGroupsForGarment(garmentType)) : null;
    for (const [group, value] of Object.entries(suggested)) {
      if (details[group] || !isValidPatternDetail(group, value) || (groups && !groups.has(group))) continue;
      // A collar is a piece that shows on the photo: read there (or chosen by the customer), never invented from text.
      // The AI filled `col = OFFICIER` on square-necked ball gowns whose photo reading left `col` empty.
      if (group === 'col' && COLLAR_PIECES.has(value)) continue;
      // Under a collar the neckline is the collar's (an AI `decollete` MOYEN dug a 6–7 cm neckline under high collars),
      // and a boat neckline is shallow by definition.
      if (group === 'decollete' && OWN_NECKLINE.has(details['col'] ?? '')) continue;
      details[group] = value;
      acceptedKeys.push(group);
    }
    return { details, acceptedKeys };
  }

  /**
   * A draped garment cannot be fully described by flat pieces: say so, instead of presenting the
   * flat block as a ready-to-sew pattern.
   */
  drapingAdvice(profile: GarmentProfile | null | undefined): DrapingAdvice | null {
    const method = profile?.constructionMethod;
    if (method !== 'DRAPING' && method !== 'MIXED') return null;
    const notes = profile?.constructionNotes ?? null;
    const scope =
      method === 'DRAPING'
        ? 'Ce vêtement est un drapé : il se construit en moulage directement sur mannequin. Le patron plat ne fournit que le bloc de base (doublure / structure).'
        : 'Ce vêtement est mixte : la base ajustée se trace à plat, mais les parties drapées (traîne, surjupe, drapé…) se façonnent sur mannequin.';
    return { method, notes, warning: notes ? `${scope} ${notes}` : scope };
  }
}
