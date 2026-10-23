/**
 * Garnitures in 3D: a lace berthe laid on the draped bodice, gathered frills round the sleeve hems, bead rows.
 * Pure geometry (numbers in, meshes out). The berthe is placed through the bodice's own drape: `cloth(fx, fy)` maps a
 * point of the bodice pattern (mm, the panel's frame) onto the draped cloth, so the berthe follows the bodice exactly
 * and the pattern decides its depth and its point.
 */
type V3 = [number, number, number];
type Pt = { x: number; y: number };

export interface TrimMesh {
  positions: number[];
  indices: number[];
  border: number[];
  uvs: number[];
}

/** Maps a point of a bodice panel's pattern (mm) onto its draped cloth (m). */
export type ClothMap = (fx: number, fy: number) => V3;

/** Columns across a berthe half, rows down it. */
export const BERTHE_COLUMNS = 40;
export const BERTHE_ROWS = 6;
/** Lace stands this far (m) off the bodice at its top edge, a little more at its scalloped bottom. */
const LACE_LIFT_TOP = 0.003;
const LACE_LIFT_BOTTOM = 0.008;
/** Scallops of the lace's bottom edge: depth and spacing (mm). */
export const SCALLOP_MM = 9;
const SCALLOP_PERIOD_MM = 32;

/** Rings down a frill (top → hem). */
export const FRILL_ROWS = 5;
/** A frill opens out to this much wider at its hem than where it is sewn on. */
const FRILL_FLARE = 0.45;
/** Waves round a frill (its gathers): one every ~2 cm of the hem it is sewn round. */
const FRILL_WAVE_M = 0.02;
const FRILL_WAVE_DEPTH = 0.12;
/** Each frill shows this share of its depth below the next one up (tiers overlap). */
export const FRILL_SHOW = 0.55;

/** Gap (m) left between two beads of a row. */
const BEAD_GAP = 0.0006;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** y of a polyline (x growing) at x, by linear interpolation; clamped at its ends. */
export const yAt = (edge: Pt[], x: number): number => {
  if (x <= edge[0]!.x) return edge[0]!.y;
  for (let i = 1; i < edge.length; i += 1) {
    const a = edge[i - 1]!;
    const b = edge[i]!;
    if (x <= b.x) return b.x === a.x ? b.y : lerp(a.y, b.y, (x - a.x) / (b.x - a.x));
  }
  return edge[edge.length - 1]!.y;
};

/**
 * Top and bottom edges of a berthe piece (the engine's outline: its top edge from the centre line out, x growing, then
 * its bottom edge back). Null when the outline is not shaped so.
 */
export const bertheEdges = (polygon: Pt[]): { top: Pt[]; bottom: Pt[] } | null => {
  const top: Pt[] = [];
  for (const p of polygon) {
    if (top.length > 0 && p.x <= top[top.length - 1]!.x) break;
    top.push(p);
  }
  const bottom = polygon.slice(top.length).reverse();
  return top.length >= 2 && bottom.length >= 2 ? { top, bottom } : null;
};

/** Outward unit direction (horizontal, away from the body axis) at a point. */
const outward = (p: V3, axisZ: number): V3 => {
  const len = Math.hypot(p[0], p[2] - axisZ) || 1;
  return [p[0] / len, 0, (p[2] - axisZ) / len];
};

/** Triangles and outline of a rows × cols grid of vertices (row-major), `closed` joining the last column to the first. */
const grid = (mesh: TrimMesh, base: number, rows: number, cols: number, closed: boolean): void => {
  const width = closed ? cols : cols + 1;
  const at = (i: number, j: number): number => base + i * width + (closed ? j % cols : j);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      mesh.indices.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1));
    }
  }
  const p = (v: number): number[] => mesh.positions.slice(v * 3, v * 3 + 3);
  // Outline: the top and the bottom rows (and the ends of an open strip).
  for (const i of [0, rows]) for (let j = 0; j < cols; j += 1) mesh.border.push(...p(at(i, j)), ...p(at(i, j + 1)));
  if (!closed) for (const j of [0, cols]) for (let i = 0; i < rows; i += 1) mesh.border.push(...p(at(i, j)), ...p(at(i + 1, j)));
};

/** Adds the mirror (x → −x) of every vertex, with the winding turned back (the other half of a piece cut on the fold). */
const mirror = (mesh: TrimMesh): void => {
  const count = mesh.positions.length / 3;
  for (let i = 0; i < count; i += 1) mesh.positions.push(-mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!);
  for (let i = 0; i < count; i += 1) mesh.uvs.push(-mesh.uvs[i * 2]!, mesh.uvs[i * 2 + 1]!);
  const tris = mesh.indices.length;
  for (let t = 0; t < tris; t += 3) mesh.indices.push(mesh.indices[t]! + count, mesh.indices[t + 2]! + count, mesh.indices[t + 1]! + count);
  const lines = mesh.border.length;
  for (let k = 0; k < lines; k += 3) mesh.border.push(-mesh.border[k]!, mesh.border[k + 1]!, mesh.border[k + 2]!);
};

/**
 * The lace berthe on one bodice panel (front or back): laid on the draped cloth between the piece's top and bottom edges,
 * a few millimetres proud of it, its bottom edge scalloped; both halves (the piece is cut on the centre fold).
 */
export const drapeBerthe = (polygon: Pt[], cloth: ClothMap, axisZ: number): TrimMesh | null => {
  const edges = bertheEdges(polygon);
  if (!edges) return null;
  const { top, bottom } = edges;
  const x0 = top[0]!.x;
  const x1 = top[top.length - 1]!.x;
  const mesh: TrimMesh = { positions: [], indices: [], border: [], uvs: [] };
  for (let r = 0; r <= BERTHE_ROWS; r += 1) {
    const t = r / BERTHE_ROWS;
    for (let c = 0; c <= BERTHE_COLUMNS; c += 1) {
      const x = lerp(x0, x1, c / BERTHE_COLUMNS);
      const yTop = yAt(top, x);
      // Scallops: the bottom edge rises between them (a lace border), never above half the band.
      const scallop = SCALLOP_MM * (0.5 - 0.5 * Math.cos((2 * Math.PI * (x - x0)) / SCALLOP_PERIOD_MM));
      const yBottom = Math.max(yTop + 0.5 * (yAt(bottom, x) - yTop), yAt(bottom, x) - scallop);
      const y = lerp(yTop, yBottom, t);
      const p = cloth(x, y);
      const out = outward(p, axisZ);
      const lift = lerp(LACE_LIFT_TOP, LACE_LIFT_BOTTOM, t);
      mesh.positions.push(p[0] + out[0] * lift, p[1], p[2] + out[2] * lift);
      mesh.uvs.push(x / 1000, y / 1000);
    }
  }
  grid(mesh, 0, BERTHE_ROWS, BERTHE_COLUMNS, false);
  mirror(mesh);
  return mesh;
};

/**
 * A gathered frill sewn round a sleeve ring (one sleeve), hanging `depthM` along the arm's direction `dir` and opening
 * out (FRILL_FLARE) into waves (its gathers).
 */
export const drapeFrill = (ring: V3[], dir: V3, depthM: number): TrimMesh => {
  const n = ring.length;
  const c: V3 = [0, 1, 2].map((k) => ring.reduce((s, p) => s + p[k]!, 0) / n) as V3;
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d: V3 = [dir[0] / len, dir[1] / len, dir[2] / len];
  let girth = 0;
  for (let j = 0; j < n; j += 1) girth += Math.hypot(...([0, 1, 2].map((k) => ring[(j + 1) % n]![k]! - ring[j]![k]!) as V3));
  const waves = Math.max(6, Math.round(girth / FRILL_WAVE_M));
  const mesh: TrimMesh = { positions: [], indices: [], border: [], uvs: [] };
  for (let s = 0; s <= FRILL_ROWS; s += 1) {
    const t = s / FRILL_ROWS;
    for (let j = 0; j < n; j += 1) {
      const p = ring[j]!;
      const spread = 1.03 + FRILL_FLARE * t;
      const wave = 1 + FRILL_WAVE_DEPTH * t * Math.sin((2 * Math.PI * waves * j) / n);
      mesh.positions.push(
        c[0] + (p[0] - c[0]) * spread * wave + d[0] * depthM * t,
        c[1] + (p[1] - c[1]) * spread * wave + d[1] * depthM * t,
        c[2] + (p[2] - c[2]) * spread * wave + d[2] * depthM * t,
      );
      mesh.uvs.push((girth * j) / n, depthM * t);
    }
  }
  grid(mesh, 0, FRILL_ROWS, n, true);
  return mesh;
};

/**
 * Bead centres along a polyline (m): one every bead diameter (+ a hair), each pushed `lift` (m) out from the body axis
 * so it sits on the cloth. `closed` walks back to the start (a ring round a sleeve or the waist).
 */
export const beadsAlong = (line: V3[], beadM: number, axisZ: number, lift: number, closed = false): V3[] => {
  const pts = closed && line.length > 1 ? [...line, line[0]!] : line;
  const step = beadM + BEAD_GAP;
  const out: V3[] = [];
  let carry = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    let s = carry;
    while (s <= seg) {
      const t = seg > 0 ? s / seg : 0;
      const p: V3 = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
      const o = outward(p, axisZ);
      out.push([p[0] + o[0] * lift, p[1], p[2] + o[2] * lift]);
      s += step;
    }
    carry = s - seg;
  }
  return out;
};

/** The same row on the other half of a piece cut on the fold (x → −x), centre bead not doubled. */
export const withMirrorBeads = (beads: V3[]): V3[] => [...beads, ...beads.filter((b) => Math.abs(b[0]) > 0.002).map((b) => [-b[0], b[1], b[2]] as V3)];
