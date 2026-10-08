import { Injectable } from '@nestjs/common';
import type { GarmentProfile, InspirationAnalysisSnapshot } from '@angaly/types';
import {
  PATTERN_DETAIL_OPTIONS,
  isValidPatternDetail,
} from '../../domain/constants/pattern-detail-options';

export interface MergedParameters {
  cutType: string;
  details: Record<string, string>;
  /** Detail groups taken from the photo analysis because the customer left them empty. */
  fromPhotoKeys: string[];
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
@Injectable()
export class InspirationParametersService {
  merge(
    project: { cutType: string | null; details: Record<string, string> },
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
    }

    return {
      cutType: project.cutType ?? (profile?.isGarment ? profile.cutType : null) ?? 'DROITE',
      details,
      fromPhotoKeys,
    };
  }

  /** Detail groups still empty after the merge — candidates for an AI suggestion. */
  missingGroups(details: Record<string, string>): string[] {
    return Object.keys(PATTERN_DETAIL_OPTIONS).filter((group) => !details[group]);
  }

  /** Keeps only valid, non-overriding values from an AI suggestion. */
  acceptSuggestedDetails(
    current: Record<string, string>,
    suggested: Record<string, string>,
  ): { details: Record<string, string>; acceptedKeys: string[] } {
    const details = { ...current };
    const acceptedKeys: string[] = [];
    for (const [group, value] of Object.entries(suggested)) {
      if (details[group] || !isValidPatternDetail(group, value)) continue;
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
