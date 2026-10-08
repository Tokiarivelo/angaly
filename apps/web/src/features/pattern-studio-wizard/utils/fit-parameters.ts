import {
  EASE_LEVELS,
  DRAPE_BLOCK_LABELS,
  EASE_LEVEL_LABELS,
  FABRIC_BEHAVIOR_LABELS,
  listPatternExtKeys,
  type DrapeSpec,
  type GarmentProfile,
  type PatternExtKey,
  mergePatternExtParameters,
  validatePatternExtParameters,
  type EaseLevel,
  type PatternExtParameters,
} from '@angaly/types';

export type FitChange =
  | { field: 'ease'; value: EaseLevel | null }
  | { field: 'drape'; value: DrapeSpec | null }
  | { field: 'fullness.skirt' | 'fullness.sleeve' | 'lengths.skirtPct' | 'lengths.sleevePct' | 'lengths.bodicePct'; value: number | null };

/** Which adjustments make sense for a garment (a trouser has no skirt length, a skirt has no sleeve). */
export function fitControlsFor(garment: string | null | undefined): {
  skirt: boolean;
  sleeve: boolean;
  bodice: boolean;
} {
  const g = (garment ?? '').toUpperCase();
  return {
    skirt: g === 'JUPE' || g === 'ROBE' || g === 'ROBE_MARIEE',
    sleeve: ['ROBE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE'].includes(g),
    bodice: ['ROBE', 'VESTE', 'COSTUME', 'CHEMISE', 'ROBE_MARIEE', 'AUTRE'].includes(g),
  };
}

/**
 * Applies one change to the current extended parameters and returns the next VALID value.
 * `null` clears a field (back to the engine default). An out-of-range number is ignored (the
 * previous value is kept) — the API would reject it anyway.
 */
export function applyFitChange(
  current: PatternExtParameters | undefined,
  change: FitChange,
): PatternExtParameters {
  const draft: PatternExtParameters = {
    ...(current?.ease ? { ease: current.ease } : {}),
    ...(current?.fullness ? { fullness: { ...current.fullness } } : {}),
    ...(current?.lengths ? { lengths: { ...current.lengths } } : {}),
    ...(current?.drape ? { drape: { blocks: [...current.drape.blocks] } } : {}),
  };

  if (change.field === 'drape') {
    if (change.value === null) delete draft.drape;
    else draft.drape = change.value;
  } else if (change.field === 'ease') {
    if (change.value === null) delete draft.ease;
    else if ((EASE_LEVELS as readonly string[]).includes(change.value)) draft.ease = change.value;
  } else {
    const [group, name] = change.field.split('.') as ['fullness' | 'lengths', string];
    const bucket: Record<string, number> = { ...(draft[group] as Record<string, number> | undefined) };
    if (change.value === null) delete bucket[name];
    else bucket[name] = change.value;
    if (Object.keys(bucket).length === 0) delete draft[group];
    else (draft as Record<string, unknown>)[group] = bucket;
  }

  const { value, issues } = validatePatternExtParameters(draft);
  return issues.length > 0 ? (current ?? {}) : value;
}

/** What the photo analysis suggests (validated again here), or `undefined` for a non-garment / no fit. */
export function suggestedFitFrom(profile: GarmentProfile | null | undefined): PatternExtParameters | undefined {
  if (!profile?.isGarment) return undefined;
  // Same rule as the API: a free drape (DRAPING) never gets deterministic blocks.
  const blocks = profile.constructionMethod === 'DRAPING' ? [] : (profile.drapeBlocks ?? []);
  const { value } = validatePatternExtParameters({
    ...profile.fit,
    ...(blocks.length > 0 ? { drape: { blocks } } : {}),
  });
  return listPatternExtKeys(value).length > 0 ? value : undefined;
}

/** The customer's choice wins; the photo suggestion fills the rest — what generation will really use. */
export function effectiveFit(
  chosen: PatternExtParameters | undefined,
  suggested: PatternExtParameters | undefined,
): { value: PatternExtParameters; fromSuggestion: PatternExtKey[] } {
  const merged = mergePatternExtParameters(chosen, suggested);
  return {
    value: merged.value,
    fromSuggestion: listPatternExtKeys(merged.value).filter((key) => merged.origin[key] === 1),
  };
}

/** Read-only rows describing what the photo suggests (labels in French), for the garment sheet. */
export function buildFitRows(profile: GarmentProfile | null | undefined): Array<{ label: string; value: string }> {
  const suggested = suggestedFitFrom(profile);
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: 'Aisance', value: suggested?.ease ? EASE_LEVEL_LABELS[suggested.ease] : undefined },
    {
      label: 'Ampleur de jupe',
      value: suggested?.fullness?.skirt !== undefined ? `×${suggested.fullness.skirt}` : undefined,
    },
    {
      label: 'Ampleur de manche',
      value: suggested?.fullness?.sleeve !== undefined ? `×${suggested.fullness.sleeve}` : undefined,
    },
    {
      label: 'Longueur de jupe',
      value: suggested?.lengths?.skirtPct !== undefined ? `${suggested.lengths.skirtPct} %` : undefined,
    },
    {
      label: 'Longueur de manche',
      value: suggested?.lengths?.sleevePct !== undefined ? `${suggested.lengths.sleevePct} %` : undefined,
    },
    {
      label: 'Longueur du buste',
      value: suggested?.lengths?.bodicePct !== undefined ? `${suggested.lengths.bodicePct} %` : undefined,
    },
    {
      label: 'Drapé suggéré',
      value: suggested?.drape?.blocks.length
        ? suggested.drape.blocks.map((b) => DRAPE_BLOCK_LABELS[b.kind]).join(', ')
        : undefined,
    },
    {
      label: 'Tissu',
      value: profile?.fit?.fabricBehavior ? FABRIC_BEHAVIOR_LABELS[profile.fit.fabricBehavior] : undefined,
    },
  ];
  return rows.filter((row): row is { label: string; value: string } => row.value !== undefined);
}
