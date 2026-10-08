/**
 * Phase 5b S2 — how the extended, validated parameters (`ease`, `fullness`, `lengths`) reshape the
 * historical construction. Pure functions, no I/O (ADR-005 / rule 19).
 *
 * Contract: every function returns its input UNCHANGED when the parameter is absent or equal to its
 * neutral value (`CONFORT`, 100 %, …) — so existing patterns are reproduced to the millimetre.
 *
 * Composition with the cut: `delta_final = cut.delta + ease.delta` (the cut gives the silhouette,
 * the ease gives the comfort). All deltas are millimetres per quarter-body piece.
 */
import type { EaseLevel, PatternParameters } from '../types';
import type { CutProfile, LegProfile, SleeveSpec, TopAdjustments } from './cut-profile';

export interface EaseProfile {
  bustDeltaMm: number;
  waistDeltaMm: number;
  hipDeltaMm: number;
  armholeDeltaMm: number;
}

const EASE_PROFILES: Record<EaseLevel, EaseProfile> = {
  AJUSTE: { bustDeltaMm: -20, waistDeltaMm: -15, hipDeltaMm: -15, armholeDeltaMm: -10 },
  CONFORT: { bustDeltaMm: 0, waistDeltaMm: 0, hipDeltaMm: 0, armholeDeltaMm: 0 },
  AMPLE: { bustDeltaMm: 30, waistDeltaMm: 25, hipDeltaMm: 30, armholeDeltaMm: 15 },
};

export function resolveEaseProfile(ease: EaseLevel | undefined): EaseProfile {
  return EASE_PROFILES[ease ?? 'CONFORT'] ?? EASE_PROFILES.CONFORT;
}

/** Length from a base length and a percentage, kept inside [min, max] (mm). */
export function resolveLengthMm(
  baseMm: number,
  pct: number | undefined,
  bounds: readonly [number, number] = [0, Number.POSITIVE_INFINITY],
): number {
  if (pct === undefined || pct === 100) return baseMm;
  return Math.min(bounds[1], Math.max(bounds[0], Math.round((baseMm * pct) / 100)));
}

export function withEase(profile: CutProfile, ease: EaseLevel | undefined): CutProfile {
  if (!ease || ease === 'CONFORT') return profile;
  const e = resolveEaseProfile(ease);
  return {
    ...profile,
    bodiceDeltaMm: profile.bodiceDeltaMm + e.bustDeltaMm,
    waistDeltaMm: profile.waistDeltaMm + e.waistDeltaMm,
    hipDeltaMm: profile.hipDeltaMm + e.hipDeltaMm,
  };
}

export function withEaseTop(adj: TopAdjustments, ease: EaseLevel | undefined): TopAdjustments {
  if (!ease || ease === 'CONFORT') return adj;
  const e = resolveEaseProfile(ease);
  return {
    ...adj,
    bodiceDeltaMm: adj.bodiceDeltaMm + e.bustDeltaMm,
    waistDeltaMm: adj.waistDeltaMm + e.waistDeltaMm,
    hemDeltaMm: adj.hemDeltaMm + e.hipDeltaMm,
  };
}

export function withEaseLeg(leg: LegProfile, ease: EaseLevel | undefined): LegProfile {
  if (!ease || ease === 'CONFORT') return leg;
  const e = resolveEaseProfile(ease);
  return {
    ...leg,
    hipDeltaMm: leg.hipDeltaMm + e.hipDeltaMm,
    waistDeltaMm: leg.waistDeltaMm + e.waistDeltaMm,
  };
}

/**
 * Extra hem width for a skirt panel when `fullness.skirt` is set: `fullness` is the ratio of fabric
 * to finished hip width, so 1 adds nothing and 2 doubles the hem relative to the hip line.
 */
export function skirtFullnessExtraMm(
  fullness: PatternParameters['fullness'],
  hipWidthMm: number,
): number {
  const f = fullness?.skirt;
  if (f === undefined || f <= 1) return 0;
  return Math.round((f - 1) * hipWidthMm);
}

/**
 * Applies `lengths.sleevePct` (0 = no sleeve) and `fullness.sleeve` (sleeve-top width multiplier,
 * 1 = unchanged) to a sleeve spec. Null stays null.
 */
export function fitSleeve(
  sleeve: SleeveSpec | null,
  parameters: Pick<PatternParameters, 'fullness' | 'lengths'>,
): SleeveSpec | null {
  if (!sleeve) return sleeve;
  const pct = parameters.lengths?.sleevePct;
  if (pct === 0) return null;
  const full = parameters.fullness?.sleeve;
  return {
    ...sleeve,
    lengthMm: resolveLengthMm(sleeve.lengthMm, pct, [80, 900]),
    topRatio: full !== undefined && full > 1 ? sleeve.topRatio * full : sleeve.topRatio,
  };
}

/** Multiplier on the bodice / jacket length from `lengths.bodicePct` (1 = unchanged). */
export function bodiceLengthFactor(lengths: PatternParameters['lengths']): number {
  const pct = lengths?.bodicePct;
  return pct === undefined ? 1 : pct / 100;
}
