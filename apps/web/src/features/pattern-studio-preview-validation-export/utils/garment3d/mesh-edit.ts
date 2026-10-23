/**
 * Edit mode of the 3D garment (Blender's « Edit Mode »): the POINTS OF THE PATTERN — every vertex of every piece's
 * outline — are shown on the draped garment, selected and transformed one by one (grab / scale / rotate, axis
 * constraints, proportional editing, delete, subdivide, insert). Each move is read back onto the flat pattern
 * through the drape's local Jacobian (see sculpt.ts), so the 2D pattern is the one being edited.
 *
 * Only the outline is editable: the inside of a draped panel is computed from the pattern's row widths and has no
 * point of its own on the flat piece.
 *
 * Pure functions, no three.js: millimetres on the pattern (y down), metres in the world.
 */
import type { PatternPieceDto } from '@angaly/types';
import { insertPoint, nearestOnOutline, pieceNotches, pieceOutline, removePoint, withOutline } from '../pattern-editing';
import type { Point } from '../pattern-geometry';
import { NOT_EDITABLE, type PanelMeshData } from './garment-model';
import { anchorOnTriangle, falloffWeight, flatDelta, type Falloff, type SculptAnchor, type Vec3 } from './sculpt';

/** One pattern point as seen on one panel (a piece cut on the fold or a sleeve shows each point twice). */
export interface PointInstance {
  key: string;
  pieceId: string;
  /** Index in the piece's (open) outline. */
  index: number;
  panelId: string;
  position: Vec3;
  /** Outward normal (away from the body's axis): which side the point is seen from. */
  normal: Vec3;
  anchor: SculptAnchor;
}

export interface Proportional {
  enabled: boolean;
  radiusMm: number;
  falloff: Falloff;
}

/** A selected point and the instance it is moved through (the one clicked: a fold piece's left or right half). */
export interface SelectedPoint {
  key: string;
  pieceId: string;
  index: number;
  anchor: SculptAnchor;
}

export const pointKey = (pieceId: string, index: number): string => `${pieceId}#${index}`;

export const parsePointKey = (key: string): { pieceId: string; index: number } => {
  const at = key.lastIndexOf('#');
  return { pieceId: key.slice(0, at), index: Number(key.slice(at + 1)) };
};

/** Two instances of a point closer than this (m) are the same place on the garment. */
const SAME_PLACE = 0.02;
/** How much further (mm) than the nearest triangle a point may be held when the nearest ones are degenerate. */
const FALLBACK_MM = 40;

interface FlatTriangle {
  tri: [number, number, number];
  ax: number;
  ay: number;
  e1x: number;
  e1y: number;
  e2x: number;
  e2y: number;
  det: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Closest point of the flat triangle to p, as barycentric weights (v, w) on (b, c), and its distance (mm). */
const closestOnTriangle = (t: FlatTriangle, px: number, py: number): { v: number; w: number; d: number } => {
  const dx = px - t.ax;
  const dy = py - t.ay;
  const v = (dx * t.e2y - dy * t.e2x) / t.det;
  const w = (t.e1x * dy - t.e1y * dx) / t.det;
  if (v >= 0 && w >= 0 && v + w <= 1) return { v, w, d: 0 };
  // Outside: nearest of the three edges (a→b, a→c, b→c).
  let best = { v: 0, w: 0, d: Infinity };
  const edge = (ox: number, oy: number, ex: number, ey: number, kind: 0 | 1 | 2): void => {
    const len2 = ex * ex + ey * ey;
    const s = len2 > 0 ? Math.min(1, Math.max(0, ((px - ox) * ex + (py - oy) * ey) / len2)) : 0;
    const d = Math.hypot(px - (ox + ex * s), py - (oy + ey * s));
    if (d < best.d) best = kind === 0 ? { v: s, w: 0, d } : kind === 1 ? { v: 0, w: s, d } : { v: 1 - s, w: s, d };
  };
  edge(t.ax, t.ay, t.e1x, t.e1y, 0);
  edge(t.ax, t.ay, t.e2x, t.e2y, 1);
  edge(t.ax + t.e1x, t.ay + t.e1y, t.e2x - t.e1x, t.e2y - t.e1y, 2);
  return best;
};

/** Distance (mm) from p to the triangle's bounding box: a lower bound of its distance to the triangle. */
const boxDistance = (t: FlatTriangle, px: number, py: number): number => {
  const dx = Math.max(t.minX - px, 0, px - t.maxX);
  const dy = Math.max(t.minY - py, 0, py - t.maxY);
  return Math.hypot(dx, dy);
};

/** Cell size (mm) of the flat triangle grid. */
const GRID_MM = 25;

/** Triangles bucketed by flat grid cell: the triangles near a point without scanning the whole panel. */
const triangleGrid = (tris: FlatTriangle[]) => {
  const cells = new Map<number, FlatTriangle[]>();
  const key = (i: number, j: number): number => i * 100003 + j;
  let lo = { i: Infinity, j: Infinity };
  let hi = { i: -Infinity, j: -Infinity };
  for (const t of tris) {
    const i0 = Math.floor(t.minX / GRID_MM);
    const i1 = Math.floor(t.maxX / GRID_MM);
    const j0 = Math.floor(t.minY / GRID_MM);
    const j1 = Math.floor(t.maxY / GRID_MM);
    lo = { i: Math.min(lo.i, i0), j: Math.min(lo.j, j0) };
    hi = { i: Math.max(hi.i, i1), j: Math.max(hi.j, j1) };
    for (let i = i0; i <= i1; i += 1) {
      for (let j = j0; j <= j1; j += 1) {
        const k = key(i, j);
        const list = cells.get(k);
        if (list) list.push(t);
        else cells.set(k, [t]);
      }
    }
  }
  return {
    /** Enough rings to cover the whole panel from any point inside its extent. */
    maxRing: Math.max(1, hi.i - lo.i, hi.j - lo.j) + 2,
    /** The triangles of the cells within `ring` cells of p (each once). */
    around: (p: Point, ring: number): FlatTriangle[] => {
      const ci = Math.floor(p.x / GRID_MM);
      const cj = Math.floor(p.y / GRID_MM);
      const seen = new Set<FlatTriangle>();
      const iFrom = Math.max(ci - ring, lo.i);
      const iTo = Math.min(ci + ring, hi.i);
      const jFrom = Math.max(cj - ring, lo.j);
      const jTo = Math.min(cj + ring, hi.j);
      for (let i = iFrom; i <= iTo; i += 1) {
        for (let j = jFrom; j <= jTo; j += 1) for (const t of cells.get(key(i, j)) ?? []) seen.add(t);
      }
      return [...seen];
    },
  };
};

const outward = (normal: Vec3, position: Vec3): Vec3 => {
  // The body stands on the y axis: a normal pointing towards it is flipped.
  const toward = normal[0] * position[0] + normal[2] * position[2];
  return toward < 0 ? [-normal[0], -normal[1], -normal[2]] : normal;
};

/**
 * Where every outline point of the pieces lies on the draped panels. A point is found in the panel's triangles cut
 * from its piece (barycentric in flat coordinates); when it is just outside the draped cloth (a corner the rows do
 * not reach) the nearest triangle holds it. Each distinct place on the garment is one instance.
 */
export const outlineInstances = (panels: PanelMeshData[], pieces: PatternPieceDto[]): PointInstance[] => {
  const out: PointInstance[] = [];
  const byId = new Map(pieces.map((p) => [p.id, p]));
  for (const panel of panels) {
    const edit = panel.edit;
    if (!edit) continue;
    edit.pieceIds.forEach((pieceId, k) => {
      const piece = byId.get(pieceId);
      if (!piece) return;
      const outline = pieceOutline(piece);
      if (outline.length < 3) return;
      const tris: FlatTriangle[] = [];
      for (let t = 0; t < panel.indices.length; t += 3) {
        const a = panel.indices[t]!;
        const b = panel.indices[t + 1]!;
        const c = panel.indices[t + 2]!;
        if (edit.piece[a] !== k || edit.piece[b] !== k || edit.piece[c] !== k || k === NOT_EDITABLE) continue;
        const ax = edit.flat[a * 2]!;
        const ay = edit.flat[a * 2 + 1]!;
        const e1x = edit.flat[b * 2]! - ax;
        const e1y = edit.flat[b * 2 + 1]! - ay;
        const e2x = edit.flat[c * 2]! - ax;
        const e2y = edit.flat[c * 2 + 1]! - ay;
        const det = e1x * e2y - e2x * e1y;
        if (Math.abs(det) < 1e-6) continue;
        tris.push({
          tri: [a, b, c],
          ax,
          ay,
          e1x,
          e1y,
          e2x,
          e2y,
          det,
          minX: ax + Math.min(0, e1x, e2x),
          maxX: ax + Math.max(0, e1x, e2x),
          minY: ay + Math.min(0, e1y, e2y),
          maxY: ay + Math.max(0, e1y, e2y),
        });
      }
      if (tris.length === 0) return;
      const grid = triangleGrid(tris);
      const world = (v: number, i: number): number => panel.positions[v * 3 + i]!;
      outline.forEach((p, index) => {
        // Nearest distance first (only the grid cells around the point).
        let min = Infinity;
        for (let ring = 1; ring <= grid.maxRing; ring += 1) {
          for (const t of grid.around(p, ring)) min = Math.min(min, closestOnTriangle(t, p.x, p.y).d);
          // Anything outside the rings searched is further than (ring − 1) cells.
          if (min <= (ring - 1) * GRID_MM) break;
        }
        const near = (reach: number): Array<{ t: FlatTriangle; v: number; w: number; d: number }> => {
          const list: Array<{ t: FlatTriangle; v: number; w: number; d: number }> = [];
          for (const t of grid.around(p, Math.ceil(reach / GRID_MM) + 1)) {
            if (boxDistance(t, p.x, p.y) > reach) continue;
            const hit = closestOnTriangle(t, p.x, p.y);
            if (hit.d <= reach) list.push({ t, ...hit });
          }
          return list.sort((u, v) => u.d - v.d);
        };
        const places: Vec3[] = [];
        const place = (f: { t: FlatTriangle; v: number; w: number }): void => {
          const [a, b, c] = f.t.tri;
          const u = 1 - f.v - f.w;
          const position: Vec3 = [0, 1, 2].map((i) => world(a, i) * u + world(b, i) * f.v + world(c, i) * f.w) as Vec3;
          if (places.some((q) => Math.hypot(q[0] - position[0], q[1] - position[1], q[2] - position[2]) < SAME_PLACE)) return;
          const anchor = anchorOnTriangle(panel, f.t.tri, position, [0, 0, 1]);
          if (!anchor) return;
          places.push(position);
          out.push({
            key: pointKey(pieceId, index),
            pieceId,
            index,
            panelId: panel.id,
            position,
            normal: outward(anchor.normal, position),
            anchor: { ...anchor, flat: p },
          });
        };
        // Every triangle at the point (both halves of a fold piece)…
        for (const f of near(min + 1)) place(f);
        // …and when they are all degenerate (a seam squashed onto the shoulder), the next nearest, a little further.
        if (places.length === 0) {
          for (const f of near(min + FALLBACK_MM)) {
            place(f);
            if (places.length > 0) break;
          }
        }
      });
    });
  }
  return out;
};

/** The instance a selected key is moved through: the one on the panel it was picked on, else any. */
export const resolveSelection = (
  instances: PointInstance[],
  selection: ReadonlyMap<string, string | null>,
): SelectedPoint[] => {
  const out: SelectedPoint[] = [];
  for (const [key, panelId] of selection) {
    const own = instances.filter((i) => i.key === key);
    const pick = own.find((i) => i.panelId === panelId) ?? own[0];
    if (pick) out.push({ key, pieceId: pick.pieceId, index: pick.index, anchor: pick.anchor });
  }
  return out;
};

type Move = (p: Point, selected: SelectedPoint) => Point;

/**
 * Applies a per-point move to the selected points; with proportional editing, the other points of the same piece
 * within the radius follow their nearest selected point, weighted by the falloff (as in Blender, connected only).
 */
const applyMove = (
  pieces: PatternPieceDto[],
  selected: SelectedPoint[],
  move: Move,
  proportional: Proportional,
): PatternPieceDto[] => {
  const byPiece = new Map<string, SelectedPoint[]>();
  for (const s of selected) byPiece.set(s.pieceId, [...(byPiece.get(s.pieceId) ?? []), s]);
  return pieces.map((piece) => {
    const mine = byPiece.get(piece.id);
    if (!mine) return piece;
    const outline = pieceOutline(piece);
    const chosen = new Map(mine.filter((s) => s.index < outline.length).map((s) => [s.index, s]));
    if (chosen.size === 0) return piece;
    const next = outline.map((p, i) => {
      const own = chosen.get(i);
      if (own) return move(p, own);
      if (!proportional.enabled) return p;
      let near: SelectedPoint | null = null;
      let d = Infinity;
      for (const s of chosen.values()) {
        const q = outline[s.index]!;
        const dist = Math.hypot(q.x - p.x, q.y - p.y);
        if (dist < d) {
          d = dist;
          near = s;
        }
      }
      const w = near ? falloffWeight(proportional.falloff, d / Math.max(1, proportional.radiusMm)) : 0;
      if (w <= 0 || !near) return p;
      const moved = move(p, near);
      return { x: p.x + (moved.x - p.x) * w, y: p.y + (moved.y - p.y) * w };
    });
    return withOutline(piece, next, pieceNotches(piece));
  });
};

export type Axis = 'x' | 'y' | 'z';
const AXES: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** World displacement limited to one axis (Blender's G then X / Y / Z). */
export const constrain = (world: Vec3, axis: Axis | null): Vec3 => {
  if (!axis) return world;
  const a = AXES[axis];
  const k = world[0] * a[0] + world[1] * a[1] + world[2] * a[2];
  return [a[0] * k, a[1] * k, a[2] * k];
};

/** Grab (G): every selected point moves with the 3D displacement, read back on the pattern at its own place. */
export const grabPoints = (
  pieces: PatternPieceDto[],
  selected: SelectedPoint[],
  world: Vec3,
  proportional: Proportional,
): PatternPieceDto[] =>
  applyMove(
    pieces,
    selected,
    (p, s) => {
      const d = flatDelta(s.anchor, world);
      return { x: p.x + d.x, y: p.y + d.y };
    },
    proportional,
  );

/** Pivot per piece: the median point of its selected points (Blender's « median point »). */
const pivots = (pieces: PatternPieceDto[], selected: SelectedPoint[]): Map<string, Point> => {
  const sums = new Map<string, { x: number; y: number; n: number }>();
  const outlines = new Map(pieces.map((p) => [p.id, pieceOutline(p)]));
  for (const s of selected) {
    const p = outlines.get(s.pieceId)?.[s.index];
    if (!p) continue;
    const acc = sums.get(s.pieceId) ?? { x: 0, y: 0, n: 0 };
    sums.set(s.pieceId, { x: acc.x + p.x, y: acc.y + p.y, n: acc.n + 1 });
  }
  return new Map([...sums].map(([id, a]) => [id, { x: a.x / a.n, y: a.y / a.n }]));
};

/**
 * Scale (S) about each piece's median point; X limits it to the pattern's width, Y or Z to its length (the axes
 * of the flat piece: a scale has no 3D direction to be read through).
 */
export const scalePoints = (
  pieces: PatternPieceDto[],
  selected: SelectedPoint[],
  factor: number,
  axis: Axis | null,
  proportional: Proportional,
): PatternPieceDto[] => {
  const centre = pivots(pieces, selected);
  const fx = axis === 'y' || axis === 'z' ? 1 : factor;
  const fy = axis === 'x' ? 1 : factor;
  return applyMove(
    pieces,
    selected,
    (p, s) => {
      const c = centre.get(s.pieceId)!;
      return { x: c.x + (p.x - c.x) * fx, y: c.y + (p.y - c.y) * fy };
    },
    proportional,
  );
};

/**
 * Turn of the pattern for a turn seen on screen: a point seen from the outside of the cloth turns the same way
 * on the pattern (y down) only if the drape keeps the pattern's handedness towards the camera.
 */
export const screenToFlatTurn = (anchor: SculptAnchor, toCamera: Vec3): number => {
  if (!anchor.along) return -1;
  const [jx, jy] = anchor.along;
  const n: Vec3 = [jx[1] * jy[2] - jx[2] * jy[1], jx[2] * jy[0] - jx[0] * jy[2], jx[0] * jy[1] - jx[1] * jy[0]];
  return n[0] * toCamera[0] + n[1] * toCamera[1] + n[2] * toCamera[2] < 0 ? -1 : 1;
};

/** Rotate (R) about each piece's median point by an angle seen on screen (radians, counter-clockwise). */
export const rotatePoints = (
  pieces: PatternPieceDto[],
  selected: SelectedPoint[],
  screenAngle: number,
  toCamera: Vec3,
  proportional: Proportional,
): PatternPieceDto[] => {
  const centre = pivots(pieces, selected);
  const turn = new Map<string, number>();
  for (const s of selected) if (!turn.has(s.pieceId)) turn.set(s.pieceId, screenToFlatTurn(s.anchor, toCamera) * screenAngle);
  return applyMove(
    pieces,
    selected,
    (p, s) => {
      const c = centre.get(s.pieceId)!;
      const a = turn.get(s.pieceId)!;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      return { x: c.x + (p.x - c.x) * cos - (p.y - c.y) * sin, y: c.y + (p.x - c.x) * sin + (p.y - c.y) * cos };
    },
    proportional,
  );
};

/** Moves the selected points by a flat offset (mm): the « Transformation » panel's median X / Y fields. */
export const offsetPoints = (pieces: PatternPieceDto[], selected: SelectedPoint[], dx: number, dy: number): PatternPieceDto[] =>
  applyMove(pieces, selected, (p) => ({ x: p.x + dx, y: p.y + dy }), { enabled: false, radiusMm: 0, falloff: 'smooth' });

/** Median of the selected points on the pattern (mm), or null when they span several pieces. */
export const selectionMedian = (pieces: PatternPieceDto[], selected: SelectedPoint[]): Point | null => {
  const centre = pivots(pieces, selected);
  return centre.size === 1 ? [...centre.values()][0]! : null;
};

/** Deletes the selected points (each piece keeps at least 3); notches stay where they were. */
export const deletePoints = (pieces: PatternPieceDto[], keys: Iterable<string>): PatternPieceDto[] => {
  const byPiece = new Map<string, number[]>();
  for (const key of keys) {
    const { pieceId, index } = parsePointKey(key);
    byPiece.set(pieceId, [...(byPiece.get(pieceId) ?? []), index]);
  }
  return pieces.map((piece) => {
    const indices = byPiece.get(piece.id);
    if (!indices) return piece;
    let polygon = pieceOutline(piece);
    let notches = pieceNotches(piece);
    for (const index of [...new Set(indices)].sort((a, b) => b - a)) {
      if (polygon.length <= 3) break;
      ({ polygon, notches } = removePoint(polygon, notches, index));
    }
    return withOutline(piece, polygon, notches);
  });
};

/**
 * Subdivide: a point is added in the middle of every edge whose two ends are selected. Returns the pieces and the
 * new selection (the old points, renumbered, and the new ones), as Blender keeps the result selected.
 */
export const subdividePoints = (
  pieces: PatternPieceDto[],
  keys: Iterable<string>,
): { pieces: PatternPieceDto[]; keys: string[] } => {
  const byPiece = new Map<string, Set<number>>();
  for (const key of keys) {
    const { pieceId, index } = parsePointKey(key);
    byPiece.set(pieceId, (byPiece.get(pieceId) ?? new Set()).add(index));
  }
  const selection: string[] = [];
  const next = pieces.map((piece) => {
    const chosen = byPiece.get(piece.id);
    if (!chosen) return piece;
    let polygon = pieceOutline(piece);
    let notches = pieceNotches(piece);
    const n = polygon.length;
    const edges = [...chosen].filter((i) => i < n && chosen.has((i + 1) % n)).sort((a, b) => b - a);
    // Final index of each original point once the midpoints before it are inserted.
    const shift = (i: number): number => i + edges.filter((e) => e < i).length;
    for (const i of edges) ({ polygon, notches } = insertPoint(polygon, notches, i, 0.5));
    for (const i of chosen) if (i < n) selection.push(pointKey(piece.id, shift(i)));
    for (const e of edges) selection.push(pointKey(piece.id, shift(e) + 1));
    return withOutline(piece, polygon, notches);
  });
  return { pieces: next, keys: selection };
};

/**
 * Ctrl + click on a seam: a point is inserted on the piece's outline at the nearest place to the flat point
 * clicked (null when the click is further than `maxMm` from any edge — the middle of a panel).
 */
export const insertPointAt = (
  pieces: PatternPieceDto[],
  pieceId: string,
  flat: Point,
  maxMm: number,
): { pieces: PatternPieceDto[]; key: string } | null => {
  const piece = pieces.find((p) => p.id === pieceId);
  if (!piece) return null;
  const polygon = pieceOutline(piece);
  const hit = nearestOnOutline(polygon, flat);
  if (!hit || hit.distance > maxMm || hit.t <= 0.01 || hit.t >= 0.99) return null;
  const inserted = insertPoint(polygon, pieceNotches(piece), hit.edgeIndex, hit.t);
  const updated = withOutline(piece, inserted.polygon, inserted.notches);
  return { pieces: pieces.map((p) => (p.id === pieceId ? updated : p)), key: pointKey(pieceId, inserted.index) };
};
