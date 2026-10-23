import { ANGLES, type Support } from './body-envelope';

/**
 * Hidden supports worn under a skirt (pattern-engine `BUSTLE`): 18th-century side hoops (« Panier (poche de hanche) »)
 * and a bustle pad (« Coussin de tournure »). They are not draped; they push the skirt out, like a petticoat, but not
 * round: hoops widen the hips and stay flat front and back, a pad juts out at the back only.
 *
 * Supports are support functions of convex cross-sections (see body-envelope.ts: θ = 0 front, u = (sin θ, cos θ)).
 * Each structure is an ellipse; the skirt rests on the convex hull of the body and it (pointwise max).
 * Pure numbers, no three.js.
 */

export type UnderstructureKind = 'PANIERS' | 'COUSSIN';

export interface Understructure {
  kind: UnderstructureKind;
  /** The engine piece's bounding box (mm): a panier pocket 380 × 300, a pad 340 × 120. */
  widthMm: number;
  depthMm: number;
  /** How far the hoops stand out, as a share of the pocket's depth (0.6 – 1, wider for a fuller skirt). Default 1. */
  scale?: number;
}

/** Hoops: from this far below the waist (m) down this far at most; their widest point (m below the waist). */
const PANIERS_TOP = 0.03;
const PANIERS_MAX_LENGTH = 0.32;
const PANIERS_PEAK = 0.2;
/** What is left of the hoops' width at the bottom of the pocket (the skirt then falls straight down from it). */
const PANIERS_BOTTOM_SHARE = 0.7;

/** Pad: from the small of the back (just above the waist, m) to below it; its fullest point. */
const COUSSIN_TOP = -0.02;
const COUSSIN_BOTTOM = 0.2;
const COUSSIN_PEAK = 0.05;
/** Front-back half-thickness of the pad's own cross-section (m). */
const COUSSIN_HALF_THICKNESS = 0.06;

const smooth = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Hoops' share of their full width at a depth d (m) below the waist: 0 at the top, 1 at the peak, 0.7 at the bottom. */
export const paniersProfile = (d: number, bottom: number): number => {
  if (d < PANIERS_TOP || d > bottom) return 0;
  if (d <= PANIERS_PEAK) return smooth((d - PANIERS_TOP) / (PANIERS_PEAK - PANIERS_TOP));
  return 1 - (1 - PANIERS_BOTTOM_SHARE) * smooth((d - PANIERS_PEAK) / (bottom - PANIERS_PEAK));
};

/** Pad's share of its full height at a depth d (m) below the waist: a quick rise, then a half-ellipse down to 0. */
export const coussinProfile = (d: number): number => {
  if (d < COUSSIN_TOP || d > COUSSIN_BOTTOM) return 0;
  if (d <= COUSSIN_PEAK) return smooth((d - COUSSIN_TOP) / (COUSSIN_PEAK - COUSSIN_TOP));
  const u = (d - COUSSIN_PEAK) / (COUSSIN_BOTTOM - COUSSIN_PEAK);
  return Math.sqrt(Math.max(0, 1 - u * u));
};

/** Support of an ellipse with semi-axes a (x) and b (z), centred at (0, zc). */
const ellipse = (a: number, b: number, zc: number): Support => {
  const out = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) {
    const t = (2 * Math.PI * k) / ANGLES;
    const s = Math.sin(t);
    const c = Math.cos(t);
    out[k] = zc * c + Math.sqrt(a * a * s * s + b * b * c * c);
  }
  return out;
};

/**
 * The structure's own support at a world height, given the body's (torso) support there; null where it is absent.
 * The skirt rests on `supportMax([torso, structure])`.
 */
export const understructureSupport = (u: Understructure, waistY: number): ((y: number, torso: Support) => Support | null) => {
  const front = 0;
  const side = ANGLES / 4;
  const back = ANGLES / 2;
  if (u.kind === 'PANIERS') {
    const bottom = PANIERS_TOP + Math.min(PANIERS_MAX_LENGTH, u.widthMm / 1000);
    const reach = (u.depthMm / 1000) * Math.min(1, Math.max(0.6, u.scale ?? 1));
    return (y, torso) => {
      const p = paniersProfile(waistY - y, bottom);
      if (p <= 0) return null;
      // Flat front and back: no deeper than the body there; as wide as the hips plus the pocket at the sides.
      const b = Math.min(torso[front]!, torso[back]!);
      const a = Math.max(torso[side]!, torso[side * 3]!) + reach * p;
      return ellipse(a, b, 0);
    };
  }
  const height = u.depthMm / 1000;
  const halfWidth = u.widthMm / 2000;
  return (y, torso) => {
    const p = coussinProfile(waistY - y);
    if (p <= 0.01) return null;
    // An ellipse behind the body whose back reaches `height × p` past it; never wider than the hips.
    const b = COUSSIN_HALF_THICKNESS;
    const a = Math.min(halfWidth, Math.max(torso[side]!, torso[side * 3]!)) * Math.min(1, 0.4 + p);
    const zc = b - torso[back]! - height * p;
    return ellipse(a, b, zc);
  };
};

/** Pieces of the engine that are hidden supports, by normalised name (lower case, no accents). */
export const understructureKindOf = (normalizedName: string): UnderstructureKind | null => {
  if (normalizedName.includes('panier (poche de hanche)')) return 'PANIERS';
  if (normalizedName.includes('coussin de tournure')) return 'COUSSIN';
  return null;
};
