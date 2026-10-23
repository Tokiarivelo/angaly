/**
 * Taubin smoothing (G. Taubin, 1995) of an indexed triangle mesh: each pass moves every vertex towards the average of
 * its neighbours (λ) then back away from it (μ < −λ), which takes out the facets and one-row zigzags of a draped grid
 * without shrinking the garment as plain Laplacian smoothing does. Folds several columns wide stay.
 *
 * Vertices on the mesh's edge (an edge used by one triangle only: hems, necklines, the seams between panels) do not
 * move, so panels still meet and lengths stay as drafted. Pure number crunching, no three.js.
 */
export interface TaubinOptions {
  iterations?: number;
  lambda?: number;
  mu?: number;
}

export const TAUBIN_DEFAULTS: Required<TaubinOptions> = { iterations: 2, lambda: 0.5, mu: -0.53 };

export const taubinSmooth = (positions: ArrayLike<number>, indices: ArrayLike<number>, options: TaubinOptions = {}): Float32Array => {
  const { iterations, lambda, mu } = { ...TAUBIN_DEFAULTS, ...options };
  const out = Float32Array.from(positions);
  const n = out.length / 3;
  if (indices.length < 3 || n === 0) return out;
  const key = (a: number, b: number): number => (a < b ? a * n + b : b * n + a);
  const edgeUse = new Map<number, number>();
  const neighbours: Array<Set<number>> = Array.from({ length: n }, () => new Set<number>());
  for (let t = 0; t + 2 < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = indices[t + e]!;
      const b = indices[t + ((e + 1) % 3)]!;
      if (a === b || a >= n || b >= n) continue;
      const k = key(a, b);
      edgeUse.set(k, (edgeUse.get(k) ?? 0) + 1);
      neighbours[a]!.add(b);
      neighbours[b]!.add(a);
    }
  }
  const pinned = new Uint8Array(n);
  for (const [k, uses] of edgeUse) {
    if (uses !== 1) continue;
    pinned[Math.floor(k / n)] = 1;
    pinned[k % n] = 1;
  }
  const lists = neighbours.map((s) => Array.from(s));
  const step = (factor: number): void => {
    const delta = new Float32Array(out.length);
    for (let v = 0; v < n; v += 1) {
      const list = lists[v]!;
      if (pinned[v] || list.length === 0) continue;
      let x = 0;
      let y = 0;
      let z = 0;
      for (const u of list) {
        x += out[u * 3]!;
        y += out[u * 3 + 1]!;
        z += out[u * 3 + 2]!;
      }
      const inv = 1 / list.length;
      delta[v * 3] = factor * (x * inv - out[v * 3]!);
      delta[v * 3 + 1] = factor * (y * inv - out[v * 3 + 1]!);
      delta[v * 3 + 2] = factor * (z * inv - out[v * 3 + 2]!);
    }
    for (let i = 0; i < out.length; i += 1) out[i] = out[i]! + delta[i]!;
  };
  for (let i = 0; i < iterations; i += 1) {
    step(lambda);
    step(mu);
  }
  return out;
};

/** Falloff of a pushed vertex's offset on its neighbours, by distance in rows or columns (0 = itself). */
const FEATHER_FALLOFF = [1, 0.8, 0.5, 0.2];

/**
 * A grid of `rows + 1` rows × `cols` columns (columns wrap round when `closed`) moved from `before` to `after` here and
 * there (cloth pushed out of the body): one column pushed alone stands out of the row as a point. Each vertex takes
 * the largest of its neighbours' offsets, scaled by `FEATHER_FALLOFF`, so the push spreads as a smooth bump; a vertex
 * never moves less than it was pushed. Returns the new positions.
 */
export const featherGridOffsets = (
  before: ArrayLike<number>,
  after: ArrayLike<number>,
  rows: number,
  cols: number,
  closed: boolean,
): Float32Array => {
  const out = Float32Array.from(after);
  const width = closed ? cols : cols + 1;
  if (before.length !== after.length || before.length !== (rows + 1) * width * 3) return out;
  const reach = FEATHER_FALLOFF.length - 1;
  const offset = (v: number, k: number): number => after[v * 3 + k]! - before[v * 3 + k]!;
  const size = (v: number): number => Math.hypot(offset(v, 0), offset(v, 1), offset(v, 2));
  for (let i = 0; i <= rows; i += 1) {
    for (let j = 0; j < width; j += 1) {
      const v = i * width + j;
      let best = size(v);
      let from = v;
      let scale = 1;
      for (let di = -reach; di <= reach; di += 1) {
        const ii = i + di;
        if (ii < 0 || ii > rows) continue;
        for (let dj = -reach; dj <= reach; dj += 1) {
          let jj = j + dj;
          if (closed) jj = ((jj % cols) + cols) % cols;
          else if (jj < 0 || jj >= width) continue;
          const w = FEATHER_FALLOFF[Math.max(Math.abs(di), Math.abs(dj))]!;
          const u = ii * width + jj;
          const s = size(u) * w;
          if (s > best + 1e-9) {
            best = s;
            from = u;
            scale = w;
          }
        }
      }
      if (from === v) continue;
      for (let k = 0; k < 3; k += 1) out[v * 3 + k] = before[v * 3 + k]! + offset(from, k) * scale;
    }
  }
  return out;
};
