import { NOT_EDITABLE, type PanelMeshData } from './garment-model';

/**
 * Pattern pieces laid over the inspiration photo. The draped garment is seen from the front (orthographic: x to the
 * right, y up, the camera on +z) and fitted into the garment's box on the photo (found from the fabric's colour, or
 * set by hand): each piece becomes the patch of the photo it is cut for.
 */

/** The draped garment's box seen from the front (m). */
export interface GarmentFrame {
  minX: number;
  maxX: number;
  top: number;
  bottom: number;
}

/** Box of the garment on the photo, as fractions of the image (0 = left / top, 1 = right / bottom). */
export interface PhotoRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** One pattern piece seen from the front, in the frame's own units (u to the right, v down, 0…1). */
export interface PieceSilhouette {
  pieceId: string;
  /** Triangles on the camera's side of the body: u, v of their 3 corners (6 numbers each). */
  front: Float32Array;
  /** Triangles behind the body (the piece seen through the garment, from behind). */
  back: Float32Array;
  /** Share of the piece's draped area that faces the front (0: a back piece, 1: a front one). */
  frontShare: number;
  /** Draped area seen from the front (frame units²): the smaller piece wins a click (lace over the bodice). */
  area: number;
}

export interface GarmentProjection {
  frame: GarmentFrame;
  pieces: Map<string, PieceSilhouette>;
}

/** Depth of the upper body (m below the garment's top) whose cloth sets the front / back divide. */
const UPPER_BODY_M = 0.45;

/** Below this share of its area facing the camera, a piece is « au dos » (not seen on a front photo). */
export const FRONT_VISIBLE_SHARE = 0.35;

const triArea = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number =>
  ((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;

/** The garment's box seen from the front and its body's axis (front / back divide), or null for an empty garment. */
export const garmentFrameOf = (panels: PanelMeshData[]): (GarmentFrame & { axisZ: number }) | null => {
  let minX = Infinity;
  let maxX = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  for (const panel of panels) {
    if (panel.zone === 'beads') continue;
    const p = panel.positions;
    for (let i = 0; i < p.length; i += 3) {
      minX = Math.min(minX, p[i]!);
      maxX = Math.max(maxX, p[i]!);
      top = Math.max(top, p[i + 1]!);
      bottom = Math.min(bottom, p[i + 1]!);
    }
  }
  if (!Number.isFinite(minX) || maxX - minX < 1e-3 || top - bottom < 1e-3) return null;
  // The body's axis: the middle of the cloth's depth over the upper body, where nothing trails behind (a train lies
  // far back on the floor). Winding cannot tell the sides apart: halves are mirrored.
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const panel of panels) {
    if (panel.zone === 'beads') continue;
    const p = panel.positions;
    for (let i = 0; i < p.length; i += 3) {
      if (p[i + 1]! < top - UPPER_BODY_M) continue;
      zMin = Math.min(zMin, p[i + 2]!);
      zMax = Math.max(zMax, p[i + 2]!);
    }
  }
  return { minX, maxX, top, bottom, axisZ: Number.isFinite(zMin) ? (zMin + zMax) / 2 : 0 };
};

/** The garment's front view: its box and, per pattern piece, the triangles it covers. Null for an empty garment. */
export const projectGarment = (panels: PanelMeshData[]): GarmentProjection | null => {
  const found = garmentFrameOf(panels);
  if (!found) return null;
  const { minX, maxX, top, bottom, axisZ } = found;
  const frame = { minX, maxX, top, bottom };
  const sx = 1 / (maxX - minX);
  const sy = 1 / (top - bottom);

  const acc = new Map<string, { front: number[]; back: number[]; frontArea: number; backArea: number }>();
  const entry = (id: string) => {
    let e = acc.get(id);
    if (!e) acc.set(id, (e = { front: [], back: [], frontArea: 0, backArea: 0 }));
    return e;
  };
  for (const panel of panels) {
    if (panel.zone === 'beads' || panel.pieceIds.length === 0) continue;
    const p = panel.positions;
    const idx = panel.indices;
    const edit = panel.edit;
    for (let t = 0; t + 2 < idx.length; t += 3) {
      const a = idx[t]! * 3;
      const b = idx[t + 1]! * 3;
      const c = idx[t + 2]! * 3;
      const au = (p[a]! - minX) * sx;
      const av = (top - p[a + 1]!) * sy;
      const bu = (p[b]! - minX) * sx;
      const bv = (top - p[b + 1]!) * sy;
      const cu = (p[c]! - minX) * sx;
      const cv = (top - p[c + 1]!) * sy;
      // On the camera's side of the body's axis: seen on a front photo.
      const facing = (p[a + 2]! + p[b + 2]! + p[c + 2]!) / 3 > axisZ;
      const area = Math.abs(triArea(au, av, bu, bv, cu, cv));
      if (area < 1e-9) continue;
      // A panel built from several pieces (joined gores): each triangle belongs to the piece of its first corner.
      const k = edit ? edit.piece[idx[t]!] : undefined;
      const own = edit && k !== undefined && k !== NOT_EDITABLE ? edit.pieceIds[k] : undefined;
      const ids = own ? [own] : panel.pieceIds;
      for (const id of ids) {
        const e = entry(id);
        (facing ? e.front : e.back).push(au, av, bu, bv, cu, cv);
        if (facing) e.frontArea += area;
        else e.backArea += area;
      }
    }
  }
  const pieces = new Map<string, PieceSilhouette>();
  for (const [pieceId, e] of acc) {
    const total = e.frontArea + e.backArea;
    pieces.set(pieceId, {
      pieceId,
      front: Float32Array.from(e.front),
      back: Float32Array.from(e.back),
      frontShare: total > 0 ? e.frontArea / total : 0,
      area: e.frontArea,
    });
  }
  return { frame, pieces };
};

/** A point of the frame (u, v) on the photo (fractions of the image). */
export const toPhoto = (rect: PhotoRect, u: number, v: number): [number, number] => [
  rect.x0 + u * (rect.x1 - rect.x0),
  rect.y0 + v * (rect.y1 - rect.y0),
];

/** A point of the photo (fractions) in the frame's units. */
export const fromPhoto = (rect: PhotoRect, x: number, y: number): [number, number] => [
  (x - rect.x0) / Math.max(1e-6, rect.x1 - rect.x0),
  (y - rect.y0) / Math.max(1e-6, rect.y1 - rect.y0),
];

const inside = (t: Float32Array, i: number, u: number, v: number): boolean => {
  const d1 = triArea(u, v, t[i]!, t[i + 1]!, t[i + 2]!, t[i + 3]!);
  const d2 = triArea(u, v, t[i + 2]!, t[i + 3]!, t[i + 4]!, t[i + 5]!);
  const d3 = triArea(u, v, t[i + 4]!, t[i + 5]!, t[i]!, t[i + 1]!);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
};

/** The piece seen at a point of the frame (front view), the smallest one when several overlap; null: none. */
export const pieceAt = (projection: GarmentProjection, u: number, v: number): string | null => {
  let best: PieceSilhouette | null = null;
  for (const s of projection.pieces.values()) {
    if (best && s.area >= best.area) continue;
    for (let i = 0; i < s.front.length; i += 6) {
      if (inside(s.front, i, u, v)) {
        best = s;
        break;
      }
    }
  }
  return best?.pieceId ?? null;
};

/** Longest side (px) of the grid the photo is read on: enough for a box, cheap to scan. */
export const MASK_SIZE = 160;

/** The photo read on a small grid: 1 where the garment is. */
export interface GarmentMask {
  width: number;
  height: number;
  cells: Uint8Array;
}

/** Chromaticity distance (r, g shares of the brightness) under which a pixel is the fabric's colour, lit or shaded. */
const FABRIC_CHROMA = 0.035;
/** Fabric pixels darker than this share of the fabric's brightness are shadows round it (the floor, the background). */
const FABRIC_DARKEST = 0.3;
/** RGB distance from the background (read on the photo's border) beyond which a pixel is the subject. */
const BACKGROUND_DISTANCE = 45;
/** Below this share of the grid, the fabric's colour was not found: the subject is read against the background. */
const MIN_MASK_SHARE = 0.02;

const hexRgb = (hex: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Largest 4-connected blob of a mask (drops specks of the same colour elsewhere on the photo). */
const largestBlob = (mask: GarmentMask): GarmentMask => {
  const { width, height, cells } = mask;
  const label = new Int32Array(cells.length).fill(-1);
  let bestId = -1;
  let bestSize = 0;
  const stack: number[] = [];
  for (let start = 0; start < cells.length; start += 1) {
    if (!cells[start] || label[start] !== -1) continue;
    let size = 0;
    stack.push(start);
    label[start] = start;
    while (stack.length > 0) {
      const i = stack.pop()!;
      size += 1;
      const x = i % width;
      const near = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width];
      for (const j of near) {
        if (j >= 0 && j < cells.length && cells[j] && label[j] === -1) {
          label[j] = start;
          stack.push(j);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestId = start;
    }
  }
  const out = new Uint8Array(cells.length);
  for (let i = 0; i < cells.length; i += 1) if (label[i] === bestId) out[i] = 1;
  return { width, height, cells: out };
};

/**
 * The garment on the photo (RGBA pixels of a small copy of it): the pixels of the fabric's colour when it is known
 * (a white mannequin and a grey background are left out), otherwise what differs from the photo's border.
 */
export const garmentMask = (rgba: Uint8ClampedArray, width: number, height: number, fabricColor?: string | null): GarmentMask | null => {
  const n = width * height;
  if (n === 0 || rgba.length < n * 4) return null;
  const cells = new Uint8Array(n);
  const fabric = fabricColor ? hexRgb(fabricColor) : null;
  let count = 0;
  if (fabric) {
    const sum = fabric[0] + fabric[1] + fabric[2] || 1;
    const fr = fabric[0] / sum;
    const fg = fabric[1] / sum;
    for (let i = 0; i < n; i += 1) {
      const r = rgba[i * 4]!;
      const g = rgba[i * 4 + 1]!;
      const b = rgba[i * 4 + 2]!;
      const s = r + g + b;
      if (s < FABRIC_DARKEST * sum) continue;
      if (Math.hypot(r / s - fr, g / s - fg) < FABRIC_CHROMA) {
        cells[i] = 1;
        count += 1;
      }
    }
  }
  if (count < MIN_MASK_SHARE * n) {
    // The background: the median colour of the border.
    const border: Array<[number, number, number]> = [];
    for (let x = 0; x < width; x += 1) for (const y of [0, height - 1]) border.push([rgba[(y * width + x) * 4]!, rgba[(y * width + x) * 4 + 1]!, rgba[(y * width + x) * 4 + 2]!]);
    for (let y = 0; y < height; y += 1) for (const x of [0, width - 1]) border.push([rgba[(y * width + x) * 4]!, rgba[(y * width + x) * 4 + 1]!, rgba[(y * width + x) * 4 + 2]!]);
    const median = (k: 0 | 1 | 2) => border.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(border.length / 2)]!;
    const bg = [median(0), median(1), median(2)] as const;
    cells.fill(0);
    count = 0;
    for (let i = 0; i < n; i += 1) {
      const d = Math.hypot(rgba[i * 4]! - bg[0], rgba[i * 4 + 1]! - bg[1], rgba[i * 4 + 2]! - bg[2]);
      if (d > BACKGROUND_DISTANCE) {
        cells[i] = 1;
        count += 1;
      }
    }
  }
  if (count < MIN_MASK_SHARE * n) return null;
  return largestBlob({ width, height, cells });
};

/** Box of a mask, as fractions of the image; null when it is empty. */
export const maskRect = (mask: GarmentMask): PhotoRect | null => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < mask.cells.length; i += 1) {
    if (!mask.cells[i]) continue;
    const x = i % mask.width;
    const y = Math.floor(i / mask.width);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x + 1);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y + 1);
  }
  return Number.isFinite(x0) ? { x0: x0 / mask.width, y0: y0 / mask.height, x1: x1 / mask.width, y1: y1 / mask.height } : null;
};

/** Grid cells of the photo's garment no front-facing piece covers once fitted into `rect` (a part of the model the pattern misses). */
export interface Coverage {
  /** Share of the garment's cells some piece covers (0…1). */
  covered: number;
  /** 1 where the photo shows the garment and no piece lies. */
  missing: Uint8Array;
}

export const coverageOf = (projection: GarmentProjection, rect: PhotoRect, mask: GarmentMask): Coverage => {
  const { width, height } = mask;
  const hit = new Uint8Array(width * height);
  for (const s of projection.pieces.values()) {
    const t = s.front;
    for (let i = 0; i < t.length; i += 6) {
      const xs = [0, 2, 4].map((k) => toPhoto(rect, t[i + k]!, t[i + k + 1]!));
      const minX = Math.max(0, Math.floor(Math.min(...xs.map((p) => p[0])) * width));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(...xs.map((p) => p[0])) * width));
      const minY = Math.max(0, Math.floor(Math.min(...xs.map((p) => p[1])) * height));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(...xs.map((p) => p[1])) * height));
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const c = y * width + x;
          if (hit[c]) continue;
          const [u, v] = fromPhoto(rect, (x + 0.5) / width, (y + 0.5) / height);
          if (inside(t, i, u, v)) hit[c] = 1;
        }
      }
    }
  }
  let garment = 0;
  let covered = 0;
  const missing = new Uint8Array(width * height);
  for (let c = 0; c < hit.length; c += 1) {
    if (!mask.cells[c]) continue;
    garment += 1;
    if (hit[c]) covered += 1;
    else missing[c] = 1;
  }
  return { covered: garment > 0 ? covered / garment : 1, missing };
};
