import type { PatternPieceGeometry } from '../types';

type Outline = PatternPieceGeometry['outlineMm'];
type Pt = { x: number; y: number };

const openRing = (outline: Outline): Pt[] => {
  const first = outline[0];
  const last = outline[outline.length - 1];
  return first && last && first.x === last.x && first.y === last.y ? outline.slice(0, -1) : [...outline];
};
const close = (ring: Pt[]): Outline => [...ring, { ...ring[0]! }];
const round = (p: Pt): Pt => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });

/** [minX, maxX] of a ring on the horizontal line `y`, or null when the line misses it. */
export function rowExtentOf(ring: Pt[], y: number): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const x = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return min === Infinity ? null : [min, max];
}

/** Part of a closed ring on the left of the directed line a → b (Sutherland–Hodgman), as an open ring. */
function clipLeftOf(ring: Pt[], a: Pt, b: Pt): Pt[] {
  const side = (p: Pt): number => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  const out: Pt[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    const sp = side(p);
    const sq = side(q);
    if (sp >= 0) out.push({ ...p });
    if ((sp >= 0) !== (sq >= 0)) {
      const t = sp / (sp - sq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}

/** Where a skirt half is split into gores (lés): this share of its width, at the waist and at the hem. */
export const GORE_SHARE = 0.5;
/** The waist row the split is measured on, below the top edge (mm). */
const GORE_TOP_ROW_MM = 40;

/**
 * Gored skirt (« jupe en lés ») : a skirt half (centre line at its smallest x, side seam at its largest) is cut
 * along the straight line from `share` of its width at the top to `share` of its width at the hem — the centre
 * panel and the side gore keep the piece's own coordinates (same heights), so the 3D can put them back side by side.
 */
export function goreSplit(outline: Outline, share = GORE_SHARE): { centre: Outline; side: Outline } | null {
  const ring = openRing(outline);
  const ys = ring.map((p) => p.y);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const at = (y: number): Pt | null => {
    const e = rowExtentOf(ring, y);
    return e ? { x: e[0] + (e[1] - e[0]) * share, y } : null;
  };
  // Below the waist's own slope (the top edge rises a little towards the side seam), and just above the hem.
  const a = at(top + Math.min(GORE_TOP_ROW_MM, (bottom - top) / 4));
  const b = at(bottom - 0.5);
  if (!a || !b) return null;
  // Extend the line past both edges so it cuts the top and the hem cleanly.
  const dx = (b.x - a.x) / (b.y - a.y);
  const from = { x: a.x - dx * (a.y - top + 10), y: top - 10 };
  const to = { x: b.x + dx * (bottom - b.y + 10), y: bottom + 10 };
  // `clipLeftOf` keeps the positive side of the cross product: going top → bottom (y down) that is the small-x side.
  const centre = clipLeftOf(ring, from, to).map(round);
  const side = clipLeftOf(ring, to, from).map(round);
  if (centre.length < 3 || side.length < 3) return null;
  return { centre: close(centre), side: close(side) };
}

/** Under sleeve of a two-piece sleeve: half its width each side of the old underarm seam (share of a fitted sleeve). */
export const UNDER_SLEEVE_HALF = 0.2;
/** Rows sampled down a sleeve when it is split in two (mm). */
const SLEEVE_ROW_MM = 10;

/**
 * Two-piece sleeve (« manche en deux pièces », the base of a tailored or 1890s gigot sleeve): the one-piece sleeve
 * is cut along two lines `halfMm` in from its underarm seam (both edges), from the underarm level (the cap's lowest
 * points) to the wrist. The middle is the upper sleeve (the cap and all the puff); the two strips, joined along the
 * old seam, are the under sleeve (centred on x = 0). Both keep the sleeve's heights. `halfMm` never takes more
 * than a third of a row.
 */
export function twoPieceSleeve(outline: Outline, halfMm: number): { upper: Outline; under: Outline } | null {
  const ring = openRing(outline);
  const underarm = ring[0]!.y; // the cap starts and ends at the underarm level
  const bottom = Math.max(...ring.map((p) => p.y));
  if (bottom - underarm < 4 * SLEEVE_ROW_MM) return null;
  const rows: number[] = [];
  for (let y = underarm; y < bottom; y += SLEEVE_ROW_MM) rows.push(y);
  rows.push(bottom);
  const extent = (y: number): [number, number] => {
    const inside = Math.min(bottom - 0.01, Math.max(underarm + 0.01, y));
    return rowExtentOf(ring, inside) ?? [0, 0];
  };
  const half = (e: [number, number]): number => Math.min(halfMm, (e[1] - e[0]) / 3);
  // Upper: the cap as drawn (from the back underarm point over the crown to the front one), then down the cut lines.
  const capEnd = ring.findIndex((p, i) => i > 0 && Math.abs(p.y - underarm) < 0.01);
  if (capEnd <= 0) return null;
  const cap = ring.slice(0, capEnd + 1);
  const rightCut: Pt[] = [];
  const leftCut: Pt[] = [];
  const underRight: Pt[] = [];
  const underLeft: Pt[] = [];
  for (const y of rows) {
    const e = extent(y);
    const h = half(e);
    rightCut.push({ x: e[1] - h, y });
    leftCut.push({ x: e[0] + h, y });
    // Under sleeve, centred on the old seam: the front strip on its left (x < 0), the back strip on its right.
    underLeft.push({ x: -h, y });
    underRight.push({ x: h, y });
  }
  const upper: Pt[] = [...cap.slice(0, -1), cap[cap.length - 1]!, ...rightCut, ...leftCut.reverse()];
  const under: Pt[] = [...underRight, ...underLeft.reverse()];
  return { upper: close(upper.map(round)), under: close(under.map(round)) };
}

/** Princess seam (« découpe princesse »): where it leaves the armhole (share of the way down from the shoulder to the underarm). */
export const PRINCESS_ARMHOLE_SHARE = 0.55;
/** Where it crosses the waist and the lower edge: this share of the row's width, from the centre (or opening) edge. */
export const PRINCESS_WAIST_SHARE = 0.5;
/** Points sampled along the seam's curve, from the armhole to the waist. */
const PRINCESS_CURVE_POINTS = 8;

/** Where the segment p → q meets the horizontal line y (t in [0, 1]), or null. */
const crossY = (p: Pt, q: Pt, y: number): Pt | null => {
  if ((p.y - y) * (q.y - y) > 0 || p.y === q.y) return null;
  const t = (y - p.y) / (q.y - p.y);
  return { x: p.x + (q.x - p.x) * t, y };
};

/** Where the segments a → b and p → q cross, or null. */
const crossSegments = (a: Pt, b: Pt, p: Pt, q: Pt): Pt | null => {
  const d = (b.x - a.x) * (q.y - p.y) - (b.y - a.y) * (q.x - p.x);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((p.x - a.x) * (q.y - p.y) - (p.y - a.y) * (q.x - p.x)) / d;
  const u = ((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } : null;
};

/**
 * Princess bodice (« corsage à découpes princesse »): a bodice half (centre or opening edge at its smallest x, side seam
 * at its largest, neckline then shoulder then armhole going round) is cut along a seam that leaves the armhole
 * PRINCESS_ARMHOLE_SHARE of the way down, curves over the bust to `waistShare` of the waist's width and runs on straight
 * to the lower edge. Both parts keep the piece's own coordinates (the 3D puts them back side by side, as for gores).
 * `shoulderY` / `underarmY` / `waistY` are the piece's heights (mm). Null when the outline is not shaped so.
 */
export function princessSplit(
  outline: Outline,
  heights: { shoulderY: number; underarmY: number; waistY: number },
  waistShare = PRINCESS_WAIST_SHARE,
): { centre: Outline; side: Outline } | null {
  const ring = openRing(outline);
  const n = ring.length;
  const bottom = Math.max(...ring.map((p) => p.y));
  const armY = heights.shoulderY + (heights.underarmY - heights.shoulderY) * PRINCESS_ARMHOLE_SHARE;
  if (!(heights.waistY > armY && bottom > heights.waistY)) return null;
  // The seam leaves the armhole: the rightmost crossing of the outline with the row armY.
  let ia = -1;
  let a: Pt | null = null;
  for (let i = 0; i < n; i += 1) {
    const c = crossY(ring[i]!, ring[(i + 1) % n]!, armY);
    if (c && (!a || c.x > a.x)) {
      a = c;
      ia = i;
    }
  }
  const waist = rowExtentOf(ring, heights.waistY);
  const low = rowExtentOf(ring, bottom - 1);
  if (!a || !waist || !low) return null;
  const w: Pt = { x: waist[0] + (waist[1] - waist[0]) * waistShare, y: heights.waistY };
  const lowX = low[0] + (low[1] - low[0]) * waistShare;
  // Below the waist, straight on to the lower edge: the last crossing of that line with the outline after the armhole.
  const far: Pt = { x: w.x + ((lowX - w.x) * (bottom + 10 - w.y)) / Math.max(1, bottom - 1 - w.y), y: bottom + 10 };
  let ib = -1;
  let b: Pt | null = null;
  for (let k = 1; k < n; k += 1) {
    const i = (ia + k) % n;
    if (i === 0) break; // past the centre line: the lower edge is behind us
    const c = crossSegments(w, far, ring[i]!, ring[(i + 1) % n]!);
    if (c && c.y > w.y && (!b || c.y > b.y)) {
      b = c;
      ib = i;
    }
  }
  if (!b || ib <= ia) return null;
  // Armhole → waist: a quadratic curve leaving the armhole inwards and reaching the waist straight down.
  const ctrl: Pt = { x: w.x, y: a.y + (w.y - a.y) * 0.3 };
  const seam: Pt[] = [];
  for (let k = 1; k <= PRINCESS_CURVE_POINTS; k += 1) {
    const t = k / PRINCESS_CURVE_POINTS;
    const u = 1 - t;
    seam.push({ x: u * u * a.x + 2 * u * t * ctrl.x + t * t * w.x, y: u * u * a.y + 2 * u * t * ctrl.y + t * t * w.y });
  }
  const centre = [...ring.slice(0, ia + 1), a, ...seam, b, ...ring.slice(ib + 1)].map(round);
  const side = [a, ...ring.slice(ia + 1, ib + 1), b, ...seam.slice().reverse()].map(round);
  const dedupe = (pts: Pt[]): Pt[] => pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1]!.x, p.y - pts[i - 1]!.y) > 0.05);
  const c = dedupe(centre);
  const s = dedupe(side);
  if (c.length < 3 || s.length < 3) return null;
  return { centre: close(c), side: close(s) };
}
