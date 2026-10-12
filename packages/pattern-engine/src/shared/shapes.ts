import type { PatternPieceGeometry } from '../types';
import type { SleeveSpec } from './cut-profile';
import { fitSleeveDims } from './fit';

type Outline = PatternPieceGeometry['outlineMm'];

/** Skirt panel: straight, A-line/flared, or fishtail (narrow to the knee, flaring below). */
export function skirtOutline(
  waistWidth: number,
  hipWidth: number,
  hemWidth: number,
  length: number,
  fishtail: boolean,
): Outline {
  const hipDepth = Math.min(200, length / 2);
  const points = [
    { x: 0, y: 0 },
    { x: waistWidth, y: 10 },
    { x: hipWidth, y: hipDepth },
  ];
  if (fishtail) {
    points.push({ x: hipWidth * 0.9, y: length * 0.55 });
  }
  points.push({ x: hemWidth, y: length }, { x: 0, y: length }, { x: 0, y: 0 });
  return points;
}

/** Flat sleeve: cap, then a trapezoid down to the cuff. `topWidthMm` is the full circumference. */
export function sleeveOutline(
  topWidthMm: number,
  cuffWidthMm: number,
  capHeightMm: number,
  lengthMm: number,
): Outline {
  const inset = (topWidthMm - cuffWidthMm) / 2;
  return [
    { x: 0, y: capHeightMm },
    { x: topWidthMm / 2, y: 0 },
    { x: topWidthMm, y: capHeightMm },
    { x: topWidthMm - inset, y: capHeightMm + lengthMm },
    { x: inset, y: capHeightMm + lengthMm },
    { x: 0, y: capHeightMm },
  ];
}

export function sleevePiece(
  name: string,
  tourPoitrineMm: number,
  sleeve: SleeveSpec,
  fabricRecommendation: string | null = null,
  seamAllowanceMm = 10,
  measurements: Record<string, number> = {},
): PatternPieceGeometry {
  const dims = fitSleeveDims(
    {
      topMm: (tourPoitrineMm / 3.2) * sleeve.topRatio,
      cuffMm: (tourPoitrineMm / 3.2) * sleeve.cuffRatio,
      capMm: 150,
    },
    measurements,
  );
  const capHeight = dims.capMm;
  const top = dims.topMm;
  const cuff = dims.cuffMm;
  return {
    name,
    fabricRecommendation,
    quantity: 2,
    seamAllowanceMm,
    grainline: { angleDegrees: 90, originX: top / 2, originY: (capHeight + sleeve.lengthMm) / 2 },
    notches: [{ positionAlongEdge: 0.5, edgeIndex: 0 }],
    outlineMm: sleeveOutline(top, cuff, capHeight, sleeve.lengthMm),
  };
}

/** Points per neckline curve (the straight neck segment of a block is replaced by them). */
export const NECK_CURVE_SEGMENTS = 8;

/**
 * Replaces the straight neckline segment of a bodice outline — first point (centre line, `depthMm`
 * below the shoulder-neck point) to second point (shoulder-neck point) — by a quarter ellipse: square
 * to the centre line at the centre, rising steeply to the shoulder, as a drafted neckline is. A
 * neckline shallower than 5 mm stays straight. Returns a new outline; the input is never mutated.
 */
export function curveNeckline(outline: Outline): Outline {
  const centre = outline[0];
  const neck = outline[1];
  if (!centre || !neck || centre.x !== 0 || centre.y - neck.y < 5 || neck.x <= 0) return outline.map((p) => ({ ...p }));
  const depth = centre.y - neck.y;
  const curve: Outline = [];
  for (let i = 1; i < NECK_CURVE_SEGMENTS; i += 1) {
    const theta = (Math.PI / 2) * (i / NECK_CURVE_SEGMENTS);
    curve.push({ x: Math.round(neck.x * Math.sin(theta)), y: Math.round(neck.y + depth * Math.cos(theta)) });
  }
  return [{ ...centre }, ...curve, ...outline.slice(1).map((p) => ({ ...p }))];
}

type Pt = { x: number; y: number };

/** Part of a closed outline on one side of the horizontal line `y` (Sutherland–Hodgman), open ring. */
function clipBelowOrAbove(ring: Pt[], y: number, keepAbove: boolean): Pt[] {
  const inside = (p: Pt): boolean => (keepAbove ? p.y <= y : p.y >= y);
  const out: Pt[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if (inside(a)) out.push({ ...a });
    if (inside(a) !== inside(b)) {
      const t = (y - a.y) / (b.y - a.y);
      out.push({ x: Math.round(a.x + (b.x - a.x) * t), y });
    }
  }
  return out;
}

const openRing = (outline: Outline): Pt[] => {
  const first = outline[0]!;
  const last = outline[outline.length - 1]!;
  return first.x === last.x && first.y === last.y ? outline.slice(0, -1) : [...outline];
};

const close = (ring: Pt[]): Outline => [...ring, { ...ring[0]! }];

/** Points per gathered lower edge (the curve that holds the gathers' extra length). */
export const GATHER_EDGE_SEGMENTS = 12;
/** Deepest dip of a gathered lower edge over the bust (mm). */
const GATHER_DIP_MM = 40;

export interface UnderbustSplit {
  /** Upper front, cut at the under-bust seam; its lower edge is `fullness` times the seam's length. */
  upper: Outline;
  /** Midriff band from the under-bust seam to the waist, starting at y = 0. */
  band: Outline;
  /** Height of the seam in the bodice's frame (mm), seam length on the half front, and the upper's edge. */
  seamYMm: number;
  seamMm: number;
  gatheredEdgeMm: number;
}

/**
 * Under-bust gathers (« fronces sous la poitrine ») on a front bodice cut on the fold (centre front at
 * x = 0): the bodice is cut at `seamYMm` and the part below becomes the midriff band. The upper part's
 * lower edge is lengthened to `fullness` times the seam it is gathered onto: it dips over the bust (a
 * curve square to the centre front, at most 4 cm deep) and widens at the side seam, which is redrawn
 * straight from the underarm. The centre front stays a straight fold line. Null when the line misses.
 */
export function splitUnderbust(outline: Outline, seamYMm: number, fullness: number): UnderbustSplit | null {
  const ring = openRing(outline);
  const upperRing = clipBelowOrAbove(ring, seamYMm, true);
  const bandRing = clipBelowOrAbove(ring, seamYMm, false);
  if (upperRing.length < 3 || bandRing.length < 3) return null;
  const seamX = Math.max(...upperRing.filter((p) => p.y === seamYMm).map((p) => p.x));
  if (!(seamX > 0)) return null;
  const depth = Math.min(GATHER_DIP_MM, seamX * 0.3);
  const edgeLength = (width: number): number => {
    let total = 0;
    let px = 0;
    let py = depth;
    for (let i = 1; i <= 200; i += 1) {
      const x = (width * i) / 200;
      const y = depth * Math.cos((Math.PI * x) / (2 * width));
      total += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return total;
  };
  let lo = seamX;
  let hi = seamX * fullness;
  for (let it = 0; it < 50; it += 1) {
    const mid = (lo + hi) / 2;
    if (edgeLength(mid) < fullness * seamX) lo = mid;
    else hi = mid;
  }
  const width = Math.round((lo + hi) / 2);
  // `rest` runs from the centre-front neck point round to the underarm; the new edge closes it back.
  const rest = upperRing.filter((p) => p.y !== seamYMm);
  const edge: Pt[] = [];
  for (let i = GATHER_EDGE_SEGMENTS; i >= 0; i -= 1) {
    const x = (width * i) / GATHER_EDGE_SEGMENTS;
    edge.push({ x: Math.round(x), y: Math.round(seamYMm + depth * Math.cos((Math.PI * x) / (2 * width))) });
  }
  const upper = close([...rest, ...edge]);
  const band = close(bandRing.map((p) => ({ x: p.x, y: p.y - seamYMm })));
  return { upper, band, seamYMm, seamMm: seamX, gatheredEdgeMm: Math.round(edgeLength(width)) };
}
