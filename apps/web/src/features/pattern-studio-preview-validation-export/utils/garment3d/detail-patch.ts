/**
 * Detail pieces (a fly's facing and shield, pockets, welts, a turn-up) as cloth of their own on the garment: the engine
 * says where each lies on the piece that carries it (`internalLinesMm[].detail`, see pattern-engine `DetailArea`), and
 * the piece is laid there on the draped cloth — on top of it (outside) or just under it (inside). Being panels of
 * their own, they come apart from the garment when it is exploded. Pure number crunching, no three.js.
 */
export interface Pt {
  x: number;
  y: number;
}
export type V3 = [number, number, number];

export interface DetailSpec {
  /** Names of the detail pieces covering the area, as the engine generated them. */
  pieces: string[];
  /** Closed outline (mm, the host piece's frame). */
  area: Pt[];
  /** Sewn inside the garment (facings, bags, shields). */
  inside: boolean;
  /** Drawn on one side of a piece cut double only (the fly: on the left front). */
  single: boolean;
  /** Cut in the contrasting fabric (a gilet's points, crossed tabs). */
  contrast: boolean;
  /** Stacking order of overlapping areas (0 = next to the cloth). */
  layer: number;
  /** Drawn as a motif instead of plain cloth (embroidery, smocking); absent: plain cloth. */
  motif?: DetailMotif;
  /** Thread or motif colour (#rrggbb). */
  color?: string;
}

export type DetailMotif = 'BRODERIE' | 'SMOCKS';
const MOTIFS: ReadonlySet<string> = new Set<DetailMotif>(['BRODERIE', 'SMOCKS']);
const HEX = /^#[0-9a-f]{6}$/i;

/** A point of the host piece (mm) on its draped cloth, `lift` metres off it along the outward normal (< 0: under it). */
export type PlaceOnCloth = (x: number, y: number, lift: number) => V3 | null;

export interface PatchMesh {
  positions: number[];
  indices: number[];
  border: number[];
  uvs: number[];
}

/** How far off the cloth (m) a detail piece lies: outside on top of it, inside under it. */
export const PATCH_LIFT = 0.003;
export const PATCH_INSIDE_LIFT = -0.003;
/** Each stacking layer of a detail piece lies this much further out (m), so overlapping pieces never flicker. */
export const PATCH_LAYER_LIFT = 0.002;
/** Its outline stands this much further out than the piece (m), so the stitching shows on it. */
const PATCH_OUTLINE_LIFT = 0.0008;
/** Grid spacing (mm) of a patch, and the bounds of its rows / columns. */
const PATCH_STEP_MM = 10;
const PATCH_CELLS = [2, 32] as const;
/** The outline is sampled this often (mm) so it follows the cloth. */
const OUTLINE_STEP_MM = 8;
/** Rows are kept this far (mm) inside the area's top and bottom, where its width falls to nothing. */
const EDGE_MM = 0.5;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const isPt = (p: unknown): p is Pt =>
  typeof p === 'object' && p !== null && Number.isFinite((p as Pt).x) && Number.isFinite((p as Pt).y);

/** The detail areas the engine placed on a piece (`dimensionsJson.internalLinesMm[].detail`). */
export const detailAreasOf = (dimensionsJson: unknown): DetailSpec[] => {
  const lines = (dimensionsJson as { internalLinesMm?: unknown } | null)?.internalLinesMm;
  if (!Array.isArray(lines)) return [];
  const out: DetailSpec[] = [];
  for (const line of lines as Array<{ single?: unknown; detail?: { pieces?: unknown; area?: unknown; inside?: unknown; contrast?: unknown; layer?: unknown; motif?: unknown; color?: unknown } }>) {
    const d = line?.detail;
    if (!d || !Array.isArray(d.pieces) || !Array.isArray(d.area)) continue;
    const area = d.area.filter(isPt).map((p) => ({ x: p.x, y: p.y }));
    const pieces = d.pieces.filter((n): n is string => typeof n === 'string' && n.length > 0);
    if (area.length < 4 || pieces.length === 0) continue;
    const layer = typeof d.layer === 'number' && Number.isFinite(d.layer) ? Math.max(0, Math.round(d.layer)) : 0;
    const motif = typeof d.motif === 'string' && MOTIFS.has(d.motif) ? (d.motif as DetailMotif) : undefined;
    const color = typeof d.color === 'string' && HEX.test(d.color) ? d.color.toLowerCase() : undefined;
    out.push({
      pieces,
      area,
      inside: d.inside === true,
      single: line.single === true,
      contrast: d.contrast === true,
      layer,
      ...(motif ? { motif } : {}),
      ...(color ? { color } : {}),
    });
  }
  return out;
};

/** Leftmost and rightmost crossing of a closed outline with the row y (mm), or null. */
const extentAt = (area: Pt[], y: number): [number, number] | null => {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i + 1 < area.length; i += 1) {
    const a = area[i]!;
    const b = area[i + 1]!;
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const x = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return min === Infinity ? null : [min, max];
};

/** Points along a closed polyline, at most `step` apart. */
const densify = (points: Pt[], step: number): Pt[] => {
  const out: Pt[] = [];
  for (let k = 0; k + 1 < points.length; k += 1) {
    const a = points[k]!;
    const b = points[k + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let i = 0; i < n; i += 1) out.push({ x: lerp(a.x, b.x, i / n), y: lerp(a.y, b.y, i / n) });
  }
  if (points.length > 0) out.push(points[points.length - 1]!);
  return out;
};

/**
 * The detail piece over `area`, laid on the cloth by `place`: a grid of rows across the area (each from its left to its
 * right edge) and the area's outline as its seam line. Null when the area cannot be placed (off the cloth).
 */
export const drapePatch = (area: Pt[], place: PlaceOnCloth, inside: boolean, layer = 0): PatchMesh | null => {
  const closed = area.length > 0 && (area[0]!.x !== area[area.length - 1]!.x || area[0]!.y !== area[area.length - 1]!.y) ? [...area, area[0]!] : area;
  let minY = Infinity;
  let maxY = -Infinity;
  let width = 0;
  for (const p of closed) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  if (!(maxY - minY > 2 * EDGE_MM)) return null;
  const rows = clamp(Math.round((maxY - minY) / PATCH_STEP_MM), PATCH_CELLS[0], PATCH_CELLS[1]);
  const extents: Array<[number, number]> = [];
  for (let i = 0; i <= rows; i += 1) {
    const y = lerp(minY + EDGE_MM, maxY - EDGE_MM, i / rows);
    const e = extentAt(closed, y) ?? [0, 0];
    extents.push(e);
    width = Math.max(width, e[1] - e[0]);
  }
  if (width < 1) return null;
  const cols = clamp(Math.round(width / PATCH_STEP_MM), PATCH_CELLS[0], PATCH_CELLS[1]);
  const lift = inside ? PATCH_INSIDE_LIFT - layer * PATCH_LAYER_LIFT : PATCH_LIFT + layer * PATCH_LAYER_LIFT;
  const mesh: PatchMesh = { positions: [], indices: [], border: [], uvs: [] };
  for (let i = 0; i <= rows; i += 1) {
    const y = lerp(minY + EDGE_MM, maxY - EDGE_MM, i / rows);
    const [x0, x1] = extents[i]!;
    for (let j = 0; j <= cols; j += 1) {
      const x = lerp(x0, x1, j / cols);
      const p = place(x, y, lift);
      if (!p) return null;
      mesh.positions.push(p[0], p[1], p[2]);
      mesh.uvs.push(x / 1000, y / 1000);
    }
  }
  const w = cols + 1;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const a = i * w + j;
      mesh.indices.push(a, a + w, a + 1, a + 1, a + w, a + w + 1);
    }
  }
  const outlineLift = lift + (inside ? -PATCH_OUTLINE_LIFT : PATCH_OUTLINE_LIFT);
  let prev: V3 | null = null;
  for (const q of densify(closed, OUTLINE_STEP_MM)) {
    const p = place(clamp(q.x, -1e6, 1e6), clamp(q.y, minY + EDGE_MM, maxY - EDGE_MM), outlineLift);
    if (p && prev) mesh.border.push(...prev, ...p);
    prev = p;
  }
  return mesh;
};

/** The patch on the other side of a garment cut double (x → −x, winding flipped so it still faces out). */
export const mirrorPatch = (patch: PatchMesh): PatchMesh => {
  const flip = (a: number[]): number[] => a.map((v, k) => (k % 3 === 0 ? -v : v));
  const indices: number[] = [];
  for (let t = 0; t + 2 < patch.indices.length; t += 3) indices.push(patch.indices[t]!, patch.indices[t + 2]!, patch.indices[t + 1]!);
  return { positions: flip(patch.positions), indices, border: flip(patch.border), uvs: patch.uvs.map((v, k) => (k % 2 === 0 ? -v : v)) };
};

const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** The pattern pieces a detail names (a generated name may carry a suffix, « … (2) »). */
export const piecesNamed = <T extends { id: string; name: string }>(pieces: T[], names: string[]): T[] =>
  pieces.filter((p) => names.some((n) => normalize(p.name) === normalize(n) || normalize(p.name).startsWith(`${normalize(n)} (`)));

/** Pocket bags are cut in lining: drawn in its colour rather than the garment's fabric. */
export const isLining = (names: string[]): boolean => names.some((n) => normalize(n).startsWith('fond de poche'));
