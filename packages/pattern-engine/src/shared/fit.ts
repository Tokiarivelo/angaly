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

// ------------------------------------------------------------------------------------------
// Body-measurement fitting (Phase 5b S2b). Every function is a no-op when its measurements are
// absent, so the historical geometry is unchanged for profiles that only carry the basics.
// ------------------------------------------------------------------------------------------

type Pt = { x: number; y: number };
type Outline = Pt[];

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export interface TorsoFitOptions {
  side: 'front' | 'back';
  /** Half neck opening of this piece, mm (shoulder tips never go closer than 40 mm to it). */
  neckWidthMm: number;
  /** Index of the armhole-top point (default 2) and of the underarm point (default 3). */
  armholeTopIdx?: number;
  underarmIdx?: number;
  /** Index of the side-seam segment start where a bust dart may go (front only). Null = no dart. */
  dartSegmentIdx?: number | null;
}

/**
 * Reshapes the armhole / side seam of a top piece from the body measurements:
 *  - shoulder tip: `CARRURE_DEVANT|DOS` (half the width) else neck + `LARGEUR_EPAULE`,
 *    clamped to [neck + 40 mm, default + 30 mm];
 *  - underarm height: `PROFONDEUR_EMMANCHURE` (+ 20 mm for the nape offset);
 *  - bust dart on the side seam (front): needs `TOUR_SOUS_POITRINE` + `TOUR_POITRINE`; its
 *    intake is 5 mm per cm of cup difference beyond 12 cm (capped at 60 mm), at `HAUTEUR_POITRINE`
 *    and pointing at `ECARTEMENT_POINTS_POITRINE / 2` from centre front.
 * Returns a new outline; the input is never mutated.
 */
export function fitTorsoOutline(outline: Outline, m: Record<string, number>, o: TorsoFitOptions): Outline {
  const out = outline.map((p) => ({ ...p }));
  const top = o.armholeTopIdx ?? 2;
  const under = o.underarmIdx ?? 3;
  const tip = out[top];
  const underarm = out[under];
  if (!tip || !underarm) return out;

  const carrure = o.side === 'front' ? m['CARRURE_DEVANT'] : m['CARRURE_DOS'];
  const epaule = m['LARGEUR_EPAULE'];
  const target =
    carrure !== undefined ? (carrure * 10) / 2 : epaule !== undefined ? o.neckWidthMm + epaule * 10 : undefined;
  if (target !== undefined) {
    tip.x = Math.round(clamp(target, o.neckWidthMm + 40, tip.x + 30));
  }

  const next = out[under + 1];
  const profondeur = m['PROFONDEUR_EMMANCHURE'];
  if (profondeur !== undefined && next) {
    underarm.y = Math.round(clamp(profondeur * 10 + 20, tip.y + 80, next.y - 40));
  }

  const segIdx = o.dartSegmentIdx === undefined ? under : o.dartSegmentIdx;
  if (o.side === 'front' && segIdx !== null) {
    addBustDart(out, segIdx, m);
  }
  return out;
}

/** Inserts a bust dart wedge on the segment `segIdx → segIdx+1`, in place. No-op if not applicable. */
function addBustDart(out: Outline, segIdx: number, m: Record<string, number>): void {
  const sous = m['TOUR_SOUS_POITRINE'];
  const poitrine = m['TOUR_POITRINE'];
  const a = out[segIdx];
  const b = out[segIdx + 1];
  if (sous === undefined || poitrine === undefined || !a || !b) return;

  const intake = clamp(Math.round((poitrine - sous - 12) * 5), 0, 60);
  if (intake < 8) return;
  const half = intake / 2;
  const lo = Math.min(a.y, b.y) + half + 5;
  const hi = Math.max(a.y, b.y) - half - 5;
  if (hi < lo || b.y === a.y) return;

  const bustY = clamp(m['HAUTEUR_POITRINE'] !== undefined ? m['HAUTEUR_POITRINE'] * 10 : 250, lo, hi);
  const xAt = (y: number) => a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
  const xs = xAt(bustY);
  const apexX =
    m['ECARTEMENT_POINTS_POITRINE'] !== undefined
      ? (m['ECARTEMENT_POINTS_POITRINE'] * 10) / 2
      : Math.max(60, xs * 0.45);
  if (apexX > xs - 30) return;

  out.splice(
    segIdx + 1,
    0,
    { x: Math.round(xAt(bustY - half)), y: Math.round(bustY - half) },
    { x: Math.round(apexX), y: Math.round(bustY) },
    { x: Math.round(xAt(bustY + half)), y: Math.round(bustY + half) },
  );
}

export interface SleeveDims {
  topMm: number;
  cuffMm: number;
  capMm: number;
}

/**
 * A sleeve is never narrower than the arm it covers: top ≥ `TOUR_BRAS` + 6 cm, cuff ≥ `TOUR_POIGNET`
 * + 3 cm; the cap height follows the armhole girth (`TOUR_EMMANCHURE` / 3, 100–220 mm).
 */
export function fitSleeveDims(base: SleeveDims, m: Record<string, number>): SleeveDims {
  const bras = m['TOUR_BRAS'];
  const poignet = m['TOUR_POIGNET'];
  const emmanchure = m['TOUR_EMMANCHURE'];
  return {
    topMm: bras !== undefined ? Math.max(base.topMm, Math.round(bras * 10 + 60)) : base.topMm,
    cuffMm: poignet !== undefined ? Math.max(base.cuffMm, Math.round(poignet * 10 + 30)) : base.cuffMm,
    capMm: emmanchure !== undefined ? Math.round(clamp((emmanchure * 10) / 3, 100, 220)) : base.capMm,
  };
}

/** Collar band length: `TOUR_COU` + 2 cm of overlap, else the rule's own length. */
export function collarLengthMm(baseMm: number, m: Record<string, number>): number {
  const cou = m['TOUR_COU'];
  return cou !== undefined ? Math.round(cou * 10 + 20) : baseMm;
}

export interface TrouserGirths {
  /** Extra width added to the hip line of BOTH pieces so the thigh fits (mm). */
  thighExtraMm: number;
  /** Minimum half hem width of the front piece so the ankle fits (mm). */
  minHalfHemMm: number;
  /** Minimum half knee width of the front piece so the knee fits (mm). */
  minKneeMm: number;
}

/**
 * Trouser girth minimums from `TOUR_CUISSE` (+6 cm ease), `TOUR_GENOU` (+4 cm) and `TOUR_CHEVILLE`
 * (+4 cm). The thigh is estimated from the rule's own hip + crotch-extension widths.
 */
export function trouserGirths(tbMm: number, hipDeltaMm: number, m: Record<string, number>): TrouserGirths {
  const quarter = tbMm / 4;
  const front = quarter - 10 + hipDeltaMm + quarter * 0.18;
  const back = quarter + 10 + hipDeltaMm + quarter * 0.38;
  const cuisse = m['TOUR_CUISSE'];
  const genou = m['TOUR_GENOU'];
  const cheville = m['TOUR_CHEVILLE'];
  return {
    thighExtraMm:
      cuisse !== undefined ? Math.max(0, Math.round((cuisse * 10 + 60 - (front + back)) / 2)) : 0,
    // front + back hem circumference = 4·half + 30 (the back piece is 15 mm wider per side)
    minHalfHemMm: cheville !== undefined ? Math.round((cheville * 10 + 40 - 30) / 4) : 0,
    minKneeMm: genou !== undefined ? Math.round((genou * 10 + 40 - 30) / 4) : 0,
  };
}
