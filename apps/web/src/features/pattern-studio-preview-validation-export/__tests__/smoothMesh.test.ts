import { describe, expect, it } from 'vitest';
import { featherGridOffsets, taubinSmooth } from '../utils/garment3d/smooth-mesh';

/** A grid of cols × rows quads, as the drape builds them; `at` gives each vertex. */
const grid = (cols: number, rows: number, at: (i: number, j: number) => [number, number, number], wrap = false) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const w = wrap ? cols : cols + 1;
  for (let i = 0; i <= rows; i += 1) for (let j = 0; j < w; j += 1) positions.push(...at(i, j));
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const a = i * w + j;
      const b = i * w + ((j + 1) % w);
      const c = a + w;
      const d = b + w;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions, indices };
};

describe('taubinSmooth', () => {
  it('takes out a one-column zigzag and leaves the edges where they are', () => {
    const { positions, indices } = grid(10, 10, (i, j) => [j / 10, i / 10, j % 2 === 0 ? 0 : 0.02]);
    const out = taubinSmooth(positions, indices);
    const zig = (p: ArrayLike<number>, i: number): number => Math.abs(p[(i * 11 + 5) * 3 + 2]! - p[(i * 11 + 4) * 3 + 2]!);
    expect(zig(out, 5)).toBeLessThan(zig(positions, 5) * 0.5);
    // Edge vertices (hem, side seams) are pinned.
    for (const v of [0, 10, 5, 110, 115, 120, 55, 65]) for (let k = 0; k < 3; k += 1) expect(out[v * 3 + k]).toBeCloseTo(positions[v * 3 + k]!, 6);
  });

  it('does not shrink a tube of cloth (the girth stays as cut)', () => {
    const cols = 24;
    const { positions, indices } = grid(cols, 12, (i, j) => {
      const a = (2 * Math.PI * j) / cols;
      return [0.15 * Math.cos(a), i * 0.02, 0.15 * Math.sin(a)];
    }, true);
    const out = taubinSmooth(positions, indices);
    const mid = 6 * cols;
    for (let j = 0; j < cols; j += 1) expect(Math.hypot(out[(mid + j) * 3]!, out[(mid + j) * 3 + 2]!)).toBeGreaterThan(0.15 * 0.995);
  });

  it('returns the points unchanged when there are no triangles (beads)', () => {
    expect(Array.from(taubinSmooth([1, 2, 3, 4, 5, 6], []))).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('featherGridOffsets', () => {
  const cols = 16;
  const rows = 6;
  const ring = (bump: (i: number, j: number) => number): number[] =>
    grid(cols, rows, (i, j) => {
      const a = (2 * Math.PI * j) / cols;
      const r = 0.1 + bump(i, j);
      return [r * Math.cos(a), i * 0.02, r * Math.sin(a)];
    }, true).positions;

  const moved = (from: ArrayLike<number>, to: ArrayLike<number>, v: number): number =>
    Math.hypot(to[v * 3]! - from[v * 3]!, to[v * 3 + 1]! - from[v * 3 + 1]!, to[v * 3 + 2]! - from[v * 3 + 2]!);

  it('spreads one pushed column over its neighbours, so it no longer stands out as a point', () => {
    const before = ring(() => 0);
    const after = ring((i, j) => (j === 4 && i === 0 ? 0.01 : 0));
    const out = featherGridOffsets(before, after, rows, cols, true);
    // The pushed vertex keeps its push; its neighbours follow, less and less.
    expect(moved(before, out, 4)).toBeCloseTo(0.01, 6);
    expect(moved(before, out, 3)).toBeCloseTo(0.008, 6);
    expect(moved(before, out, 5)).toBeCloseTo(0.008, 6);
    expect(moved(before, out, 2)).toBeCloseTo(0.005, 6);
    expect(moved(before, out, cols + 4)).toBeCloseTo(0.008, 6);
    expect(moved(before, out, 12)).toBeCloseTo(0, 6);
  });

  it('never moves a vertex less than it was pushed, and wraps round the closed seam', () => {
    const before = ring(() => 0);
    const after = ring((i, j) => (j === 0 ? 0.004 : j === 15 && i === 2 ? 0.01 : 0));
    const out = featherGridOffsets(before, after, rows, cols, true);
    for (let i = 0; i <= rows; i += 1) expect(moved(before, out, i * cols)).toBeGreaterThanOrEqual(0.004 - 1e-6);
    // Column 1 is two columns from column 15 across the seam.
    expect(moved(before, out, 2 * cols + 1)).toBeCloseTo(0.005, 6);
  });

  it('returns the pushed points as they are when the grid does not match', () => {
    expect(Array.from(featherGridOffsets([0, 0, 0], [1, 1, 1], 4, 4, true))).toEqual([1, 1, 1]);
  });
});
