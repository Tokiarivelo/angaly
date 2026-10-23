/**
 * Modelling the pattern on the 3D garment. Every draped vertex knows the point of the pattern piece it was
 * draped from (PanelMeshData.edit), so a drag on the fabric is read back onto the flat pattern:
 *
 *   1. anchor — where the fabric was grabbed: the piece, the flat point (mm) and the local map from a world
 *      displacement (m) to a flat one (the pseudo-inverse of the drape's Jacobian on that triangle);
 *   2. stroke — the flat displacement applied to the piece's OUTLINE around that point (the drape is built from
 *      the outline only), with a brush radius and falloff;
 *   3. the pieces are draped again: the 3D and every 2D view show the new pattern.
 *
 * Pure functions, no three.js: millimetres on the pattern (y down), metres in the world.
 */
import type { PatternPieceDto } from '@angaly/types';
import {
  hasSelfIntersection,
  insertPoint,
  pieceNotches,
  pieceOutline,
  withOutline,
  type Notch,
} from '../pattern-editing';
import { getBounds, type Point } from '../pattern-geometry';
import { NOT_EDITABLE, rowExtent, type PanelMeshData } from './garment-model';

export type Vec3 = [number, number, number];

/**
 * grab: drag the cloth (its outline) where it is held; width: let out / take in the side the cloth is held on,
 * over a band of heights; length: lengthen / shorten everything beyond the point held; smooth: even out the
 * outline under the brush.
 */
export type SculptTool = 'grab' | 'width' | 'length' | 'smooth';
export type Falloff = 'smooth' | 'linear' | 'sharp' | 'constant';

export interface SculptAnchor {
  pieceId: string;
  /** The point held, in the piece's outline coordinates (mm). */
  flat: Point;
  /** World displacement (m) → flat displacement (mm): 2 × 3, row-major. */
  inverse: [number, number, number, number, number, number];
  /** Fabric normal at the point (unit), facing the viewer for the panel grabbed. */
  normal: Vec3;
  /** 1 for the piece grabbed; less for a neighbour reached by the brush (see `neighbourAnchors`). */
  weight: number;
  /** World displacement (m) per flat mm along x and along y: the drape's Jacobian columns. */
  along?: [Vec3, Vec3] | undefined;
}

export interface SculptSettings {
  tool: SculptTool;
  radiusMm: number;
  falloff: Falloff;
}

export interface Stroke extends SculptSettings {
  /** The point held (mm). */
  center: Point;
  /** Flat displacement (mm). */
  delta: Point;
  /** How far the cloth is pulled away from the body (mm, along the normal; < 0 pushed in). */
  push: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Brush weight for a distance ratio (0 at the centre, 1 at the radius). */
export const falloffWeight = (falloff: Falloff, ratio: number): number => {
  const r = clamp(ratio, 0, 1);
  if (ratio >= 1) return 0;
  switch (falloff) {
    case 'constant':
      return 1;
    case 'linear':
      return 1 - r;
    case 'sharp':
      return (1 - r) ** 3;
    case 'smooth':
      return 0.5 + 0.5 * Math.cos(Math.PI * r);
  }
};

const vertex = (panel: PanelMeshData, v: number): Vec3 => [
  panel.positions[v * 3]!,
  panel.positions[v * 3 + 1]!,
  panel.positions[v * 3 + 2]!,
];

const flatOf = (panel: PanelMeshData, v: number): Point => ({ x: panel.edit!.flat[v * 2]!, y: panel.edit!.flat[v * 2 + 1]! });

/**
 * The anchor on triangle (a, b, c) of a panel at the world point `at` (null when the triangle is not cut from
 * one piece, or is folded flat). `towards` orients the normal (the direction to the camera).
 */
export const anchorOnTriangle = (
  panel: PanelMeshData,
  [a, b, c]: [number, number, number],
  at: Vec3,
  towards: Vec3,
): SculptAnchor | null => {
  const edit = panel.edit;
  if (!edit) return null;
  const k = edit.piece[a];
  if (k === undefined || k === NOT_EDITABLE || edit.piece[b] !== k || edit.piece[c] !== k) return null;
  const pieceId = edit.pieceIds[k];
  if (!pieceId) return null;
  const pa = vertex(panel, a);
  const e1 = sub(vertex(panel, b), pa);
  const e2 = sub(vertex(panel, c), pa);
  const fa = flatOf(panel, a);
  const fb = flatOf(panel, b);
  const fc = flatOf(panel, c);
  const f1 = { x: fb.x - fa.x, y: fb.y - fa.y };
  const f2 = { x: fc.x - fa.x, y: fc.y - fa.y };
  const det = f1.x * f2.y - f2.x * f1.y;
  if (Math.abs(det) < 1e-6) return null;
  // World = J · flat with J = E · F⁻¹ (E = [e1 e2], 3 × 2; F = [f1 f2], 2 × 2).
  const inv = [f2.y / det, -f2.x / det, -f1.y / det, f1.x / det]; // F⁻¹, row-major
  const jx: Vec3 = [0, 1, 2].map((r) => e1[r]! * inv[0]! + e2[r]! * inv[2]!) as Vec3;
  const jy: Vec3 = [0, 1, 2].map((r) => e1[r]! * inv[1]! + e2[r]! * inv[3]!) as Vec3;
  // Pseudo-inverse (JᵀJ)⁻¹Jᵀ: the flat displacement whose drape comes closest to the world one.
  const g11 = dot(jx, jx);
  const g12 = dot(jx, jy);
  const g22 = dot(jy, jy);
  const gd = g11 * g22 - g12 * g12;
  if (!(gd > 1e-18)) return null;
  const r0: Vec3 = [0, 1, 2].map((r) => (g22 * jx[r]! - g12 * jy[r]!) / gd) as Vec3;
  const r1: Vec3 = [0, 1, 2].map((r) => (g11 * jy[r]! - g12 * jx[r]!) / gd) as Vec3;
  // Barycentric coordinates of the point → the flat point held.
  const d = sub(at, pa);
  const d00 = dot(e1, e1);
  const d01 = dot(e1, e2);
  const d11 = dot(e2, e2);
  const d20 = dot(d, e1);
  const d21 = dot(d, e2);
  const bd = d00 * d11 - d01 * d01;
  const v = bd > 0 ? clamp((d11 * d20 - d01 * d21) / bd, 0, 1) : 0;
  const w = bd > 0 ? clamp((d00 * d21 - d01 * d20) / bd, 0, 1 - v) : 0;
  const flat = { x: fa.x + f1.x * v + f2.x * w, y: fa.y + f1.y * v + f2.y * w };
  let normal = cross(e1, e2);
  const len = Math.hypot(...normal) || 1;
  normal = normal.map((n) => n / len) as Vec3;
  if (dot(normal, towards) < 0) normal = normal.map((n) => -n) as Vec3;
  return { pieceId, flat, inverse: [...r0, ...r1], normal, weight: 1, along: [jx, jy] };
};

/** World displacement (m) → flat displacement (mm) at an anchor. */
export const flatDelta = (anchor: SculptAnchor, world: Vec3): Point => {
  const m = anchor.inverse;
  return { x: m[0] * world[0] + m[1] * world[1] + m[2] * world[2], y: m[3] * world[0] + m[4] * world[1] + m[5] * world[2] };
};

/** How far (mm) a world displacement pulls the cloth off the body at an anchor. */
export const pushOf = (anchor: SculptAnchor, world: Vec3): number => dot(anchor.normal, world) * 1000;

/**
 * Anchors on the OTHER pieces the brush reaches (the back's side seam when the front's is held, both hems…):
 * each piece's vertex nearest to the point, weighted by its distance. One anchor per piece; the one held wins.
 */
export const neighbourAnchors = (
  panels: PanelMeshData[],
  primary: SculptAnchor,
  at: Vec3,
  radiusMm: number,
  falloff: Falloff,
): SculptAnchor[] => {
  const reach = radiusMm / 1000;
  const best = new Map<string, { panel: PanelMeshData; v: number; d: number }>();
  for (const panel of panels) {
    const edit = panel.edit;
    if (!edit) continue;
    for (let v = 0; v < edit.piece.length; v += 1) {
      const k = edit.piece[v]!;
      if (k === NOT_EDITABLE) continue;
      const id = edit.pieceIds[k];
      if (!id || id === primary.pieceId) continue;
      const d = Math.hypot(panel.positions[v * 3]! - at[0], panel.positions[v * 3 + 1]! - at[1], panel.positions[v * 3 + 2]! - at[2]);
      if (d >= reach) continue;
      const known = best.get(id);
      if (!known || d < known.d) best.set(id, { panel, v, d });
    }
  }
  const out: SculptAnchor[] = [];
  for (const { panel, v, d } of best.values()) {
    const weight = falloffWeight(falloff, d / reach);
    if (weight <= 0) continue;
    // Any non-degenerate triangle around the vertex gives the local map; the anchor is the vertex itself.
    for (let t = 0; t < panel.indices.length; t += 3) {
      const tri: [number, number, number] = [panel.indices[t]!, panel.indices[t + 1]!, panel.indices[t + 2]!];
      if (!tri.includes(v)) continue;
      const anchor = anchorOnTriangle(panel, tri, vertex(panel, v), primary.normal);
      if (!anchor) continue;
      out.push({ ...anchor, flat: flatOf(panel, v), weight });
      break;
    }
  }
  return out;
};

/** Row middle of the outline at a height: which side of the piece a point is on. */
const sideOf = (polygon: Point[], p: Point): number => {
  const e = rowExtent(polygon, p.y);
  const mid = e ? (e[0] + e[1]) / 2 : getBounds(polygon).minX + getBounds(polygon).width / 2;
  return p.x >= mid ? 1 : -1;
};

/** Which end of the piece a length stroke moves: +1 everything below the point, −1 everything above. */
const lengthDirection = (polygon: Point[], p: Point): number => {
  const b = getBounds(polygon);
  return p.y >= b.minY + b.height / 2 ? 1 : -1;
};

/** Brush weight of an outline point for a stroke (before the drag's amount). */
export const strokeWeight = (polygon: Point[], stroke: SculptSettings & { center: Point }, p: Point): number => {
  const { center, radiusMm, falloff } = stroke;
  const r = Math.max(1, radiusMm);
  switch (stroke.tool) {
    case 'grab':
    case 'smooth':
      return falloffWeight(falloff, Math.hypot(p.x - center.x, p.y - center.y) / r);
    case 'width':
      return sideOf(polygon, p) === sideOf(polygon, center) ? falloffWeight(falloff, Math.abs(p.y - center.y) / r) : 0;
    case 'length': {
      // Everything beyond the point moves as one; the cloth in between (one radius) stretches progressively.
      const dir = lengthDirection(polygon, center);
      const beyond = (p.y - center.y) * dir;
      return beyond >= 0 ? 1 : falloffWeight(falloff === 'constant' ? 'linear' : falloff, -beyond / r);
    }
  }
};

/**
 * Adds outline points where the brush weight varies, so a long straight seam can bend smoothly under the brush
 * (a 2-point edge could only tilt). Notches stay at the same place on the outline.
 */
export const densifyForStroke = (
  polygon: Point[],
  notches: Notch[],
  stroke: SculptSettings & { center: Point },
): { polygon: Point[]; notches: Notch[] } => {
  const spacing = clamp(stroke.radiusMm / 8, 3, 40);
  let poly = polygon;
  let marks = notches;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const pieces = Math.floor(length / spacing);
    if (pieces < 2) continue;
    // Only edges the brush bends: the weight differs somewhere along them.
    let lo = Infinity;
    let hi = -Infinity;
    for (let s = 0; s <= pieces; s += 1) {
      const t = s / pieces;
      const w = strokeWeight(poly, stroke, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      lo = Math.min(lo, w);
      hi = Math.max(hi, w);
    }
    if (hi - lo < 1e-3) continue;
    // Split the edge into `pieces` equal parts (the inserted points are walked over).
    for (let s = pieces - 1; s >= 1; s -= 1) {
      const inserted = insertPoint(poly, marks, i, s / (s + 1));
      poly = inserted.polygon;
      marks = inserted.notches;
    }
    i += pieces - 1;
  }
  return { polygon: poly, notches: marks };
};

/** Laplacian of the outline at vertex i: the midpoint of its neighbours. */
const neighbourMid = (polygon: Point[], i: number): Point => {
  const n = polygon.length;
  const a = polygon[(i - 1 + n) % n]!;
  const b = polygon[(i + 1) % n]!;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
};

/** The outline after a stroke (vertices only move; their number and order are kept). */
export const sculptOutline = (polygon: Point[], stroke: Stroke): Point[] => {
  if (polygon.length < 3) return polygon;
  const side = sideOf(polygon, stroke.center);
  if (stroke.tool === 'smooth') {
    // The drag's length sets how much: one radius of drag = fully smoothed (three passes).
    const amount = clamp(Math.hypot(stroke.delta.x, stroke.delta.y) / Math.max(1, stroke.radiusMm), 0, 1);
    let out = polygon;
    for (let pass = 0; pass < 3; pass += 1) {
      const from = out;
      out = from.map((p, i) => {
        const w = strokeWeight(polygon, stroke, polygon[i]!) * amount;
        if (w <= 0) return p;
        const m = neighbourMid(from, i);
        return { x: p.x + (m.x - p.x) * w, y: p.y + (m.y - p.y) * w };
      });
    }
    return out;
  }
  return polygon.map((p) => {
    const w = strokeWeight(polygon, stroke, p);
    if (w <= 0) return p;
    switch (stroke.tool) {
      case 'grab':
        return { x: p.x + stroke.delta.x * w, y: p.y + stroke.delta.y * w };
      case 'width':
        // Sideways only; pulling the cloth off the body lets it out as much as the drag along it.
        return { x: p.x + (stroke.delta.x + side * stroke.push * (Math.PI / 2)) * w, y: p.y };
      case 'length':
        return { x: p.x, y: p.y + stroke.delta.y * w };
      default:
        return p;
    }
  });
};

/** A piece ready for a stroke: its outline densified where the brush will bend it. */
export interface PreparedPiece {
  piece: PatternPieceDto;
  polygon: Point[];
  notches: Notch[];
}

export const preparePiece = (piece: PatternPieceDto, settings: SculptSettings, center: Point): PreparedPiece => {
  const dense = densifyForStroke(pieceOutline(piece), pieceNotches(piece), { ...settings, center });
  return { piece: withOutline(piece, dense.polygon, dense.notches), polygon: dense.polygon, notches: dense.notches };
};

/**
 * The piece after a stroke, or null when the stroke would make the outline cross itself (a pattern that
 * cannot be cut): the caller keeps the last valid shape.
 */
export const strokePiece = (prepared: PreparedPiece, stroke: Stroke): PatternPieceDto | null => {
  const next = sculptOutline(prepared.polygon, stroke);
  if (hasSelfIntersection(next)) return null;
  return withOutline(prepared.piece, next, prepared.notches);
};
