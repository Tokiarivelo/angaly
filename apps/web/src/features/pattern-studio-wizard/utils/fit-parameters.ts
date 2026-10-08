import {
  EASE_LEVELS,
  validatePatternExtParameters,
  type EaseLevel,
  type PatternExtParameters,
} from '@angaly/types';

export type FitChange =
  | { field: 'ease'; value: EaseLevel | null }
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
  };

  if (change.field === 'ease') {
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
