/** Shared drawing primitives of the wizard's technical flats (100 × 150 box, centre front at x = 50). */

export type SketchRole = 'garment' | 'contrast' | 'detail' | 'detailFill' | 'line' | 'dash';

export interface SketchPart {
  d: string;
  /** garment: the garment; contrast: a plastron; detail(Fill): the option shown (highlighted); line / dash: seams. */
  role: SketchRole;
}

export interface Sketch {
  view: 'front' | 'back';
  parts: SketchPart[];
}

export type P = readonly [number, number];

export const CX = 50;

const f = (n: number): string => (Math.round(n * 10) / 10).toString();
export const mirrorX = (p: P): P => [2 * CX - p[0], p[1]];
export const lerpP = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export const path = (pts: readonly P[], closed = false): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p[0])} ${f(p[1])}`).join(' ') + (closed ? ' Z' : '');

/** Points of a quadratic Bézier from a through control c to b (end point included, start excluded). */
export const quad = (a: P, c: P, b: P, n = 8): P[] =>
  Array.from({ length: n }, (_, k) => {
    const t = (k + 1) / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as P;
  });

/** Left half (x < 50) mirrored to the right: both shapes. */
export const both = (pts: readonly P[], role: SketchRole, closed = true): SketchPart[] => [
  { d: path(pts, closed), role },
  { d: path(pts.map(mirrorX), closed), role },
];
