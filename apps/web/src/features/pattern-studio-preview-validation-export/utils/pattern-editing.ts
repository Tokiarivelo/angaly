/**
 * Pure editing operations for the pattern studio (millimetres, y down). No React, no DOM.
 * Every function returns new data and never mutates its input, so the undo history can share structure.
 */
import type { PatternPieceDto } from '@angaly/types';
import { getBounds, openPolygon, type Point } from './pattern-geometry';

export type Notch = { positionAlongEdge: number; edgeIndex: number };
export type Grainline = { angleDegrees: number; originX: number; originY: number };

const round = (v: number, digits = 2): number => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

export const roundPoint = (p: Point): Point => ({ x: round(p.x), y: round(p.y) });

/** The editable polygon of a piece (closing duplicate point removed). */
export const pieceOutline = (piece: PatternPieceDto): Point[] => {
  const dims = piece.dimensionsJson as { outlineMm?: Point[] } | null;
  const outline = dims?.outlineMm;
  return Array.isArray(outline) && outline.length >= 3 ? openPolygon(outline) : [];
};

export const pieceNotches = (piece: PatternPieceDto): Notch[] =>
  Array.isArray(piece.notchesJson) ? piece.notchesJson : [];

/** Writes a polygon back to a piece and recomputes the dimensions derived from it. */
export const withOutline = (
  piece: PatternPieceDto,
  polygon: Point[],
  notches: Notch[] = pieceNotches(piece),
): PatternPieceDto => {
  const rounded = polygon.map(roundPoint);
  const bounds = rounded.length > 0 ? getBounds(rounded) : null;
  const previous = piece.dimensionsJson as { outlineMm?: Point[] } | null;
  const wasClosed = previous?.outlineMm ? previous.outlineMm.length !== openPolygon(previous.outlineMm).length : false;
  const first = rounded[0];
  return {
    ...piece,
    dimensionsJson: {
      ...(piece.dimensionsJson as Record<string, unknown>),
      widthMm: bounds ? round(bounds.width) : 0,
      heightMm: bounds ? round(bounds.height) : 0,
      outlineMm: wasClosed && first ? [...rounded, first] : rounded,
    },
    notchesJson: notches,
  };
};

export const movePoint = (polygon: Point[], index: number, to: Point): Point[] =>
  polygon.map((p, i) => (i === index ? to : p));

export const translatePolygon = (polygon: Point[], dx: number, dy: number): Point[] =>
  polygon.map((p) => ({ x: p.x + dx, y: p.y + dy }));

export interface EdgeHit {
  edgeIndex: number;
  /** 0..1 along the edge. */
  t: number;
  point: Point;
  distance: number;
}

/** Closest point of the polygon outline to `p` (for inserting a vertex or a notch). */
export const nearestOnOutline = (polygon: Point[], p: Point): EdgeHit | null => {
  let best: EdgeHit | null = null;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const point = { x: a.x + dx * t, y: a.y + dy * t };
    const distance = Math.hypot(p.x - point.x, p.y - point.y);
    if (!best || distance < best.distance) best = { edgeIndex: i, t, point, distance };
  }
  return best;
};

export const nearestVertex = (
  polygon: Point[],
  p: Point,
  maxDistance: number,
): { index: number; distance: number } | null => {
  let best: { index: number; distance: number } | null = null;
  polygon.forEach((v, index) => {
    const distance = Math.hypot(v.x - p.x, v.y - p.y);
    if (distance <= maxDistance && (!best || distance < best.distance)) best = { index, distance };
  });
  return best;
};

/** Inserts a vertex on edge `edgeIndex` at `t`; notches on that edge are split across the two new edges. */
export const insertPoint = (
  polygon: Point[],
  notches: Notch[],
  edgeIndex: number,
  t: number,
): { polygon: Point[]; notches: Notch[]; index: number } => {
  const a = polygon[edgeIndex]!;
  const b = polygon[(edgeIndex + 1) % polygon.length]!;
  const point = roundPoint({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const next = [...polygon.slice(0, edgeIndex + 1), point, ...polygon.slice(edgeIndex + 1)];
  const remapped = notches.map((n) => {
    if (n.edgeIndex < edgeIndex) return n;
    if (n.edgeIndex > edgeIndex) return { ...n, edgeIndex: n.edgeIndex + 1 };
    return n.positionAlongEdge <= t
      ? { edgeIndex, positionAlongEdge: t === 0 ? 0 : n.positionAlongEdge / t }
      : { edgeIndex: edgeIndex + 1, positionAlongEdge: t === 1 ? 0 : (n.positionAlongEdge - t) / (1 - t) };
  });
  return { polygon: next, notches: remapped, index: edgeIndex + 1 };
};

/** Removes vertex `index` (a piece keeps at least 3); notches on the merged edges stay at the same spot. */
export const removePoint = (
  polygon: Point[],
  notches: Notch[],
  index: number,
): { polygon: Point[]; notches: Notch[] } => {
  if (polygon.length <= 3 || index < 0 || index >= polygon.length) return { polygon, notches };
  const n = polygon.length;
  const before = (index - 1 + n) % n;
  const a = polygon[before]!;
  const v = polygon[index]!;
  const b = polygon[(index + 1) % n]!;
  const l1 = Math.hypot(v.x - a.x, v.y - a.y);
  const l2 = Math.hypot(b.x - v.x, b.y - v.y);
  const share = l1 + l2 === 0 ? 0.5 : l1 / (l1 + l2);
  const next = polygon.filter((_, i) => i !== index);
  const remapped = notches.map((notch): Notch => {
    if (notch.edgeIndex === before) return { edgeIndex: before, positionAlongEdge: notch.positionAlongEdge * share };
    if (notch.edgeIndex === index) {
      return { edgeIndex: before, positionAlongEdge: share + notch.positionAlongEdge * (1 - share) };
    }
    return notch.edgeIndex > index ? { ...notch, edgeIndex: notch.edgeIndex - 1 } : notch;
  });
  // When the removed vertex was index 0, the "before" edge index shifts down by one.
  const fixed = remapped.map((notch) =>
    index === 0 && (notch.edgeIndex === before) ? { ...notch, edgeIndex: next.length - 1 } : notch,
  );
  return { polygon: next, notches: fixed };
};

/** Moves vertex `index+1` along its edge so the edge measures exactly `lengthMm` (the rest is untouched). */
export const setEdgeLength = (polygon: Point[], edgeIndex: number, lengthMm: number): Point[] => {
  const a = polygon[edgeIndex];
  const toIndex = (edgeIndex + 1) % polygon.length;
  const b = polygon[toIndex];
  if (!a || !b || lengthMm <= 0) return polygon;
  const current = Math.hypot(b.x - a.x, b.y - a.y);
  if (current === 0) return movePoint(polygon, toIndex, { x: a.x + lengthMm, y: a.y });
  const k = lengthMm / current;
  return movePoint(polygon, toIndex, roundPoint({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }));
};

/** Resizes the polygon to exact bounding-box dimensions, keeping its top-left corner. */
export const resizePolygon = (polygon: Point[], widthMm?: number, heightMm?: number): Point[] => {
  if (polygon.length === 0) return polygon;
  const b = getBounds(polygon);
  const sx = widthMm && b.width > 0 ? widthMm / b.width : 1;
  const sy = heightMm && b.height > 0 ? heightMm / b.height : 1;
  return polygon.map((p) => ({ x: b.minX + (p.x - b.minX) * sx, y: b.minY + (p.y - b.minY) * sy }));
};

/** Uniform scale about the bounding-box centre. */
export const scalePolygon = (polygon: Point[], factor: number): Point[] => {
  if (polygon.length === 0 || factor <= 0) return polygon;
  const b = getBounds(polygon);
  const cx = b.minX + b.width / 2;
  const cy = b.minY + b.height / 2;
  return polygon.map((p) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor }));
};

export const rotatePolygon = (polygon: Point[], degrees: number): Point[] => {
  if (polygon.length === 0) return polygon;
  const b = getBounds(polygon);
  const cx = b.minX + b.width / 2;
  const cy = b.minY + b.height / 2;
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return polygon.map((p) => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  }));
};

/** Mirrors horizontally about the bounding-box centre (vertex order reversed to keep the winding). */
export const mirrorPolygon = (polygon: Point[], notches: Notch[]): { polygon: Point[]; notches: Notch[] } => {
  if (polygon.length === 0) return { polygon, notches };
  const b = getBounds(polygon);
  const n = polygon.length;
  const mirrored = polygon.map((p) => ({ x: b.minX + b.maxX - p.x, y: p.y })).reverse();
  // Vertex i becomes n-1-i, so edge i (i→i+1) becomes edge n-2-i traversed backwards.
  const remapped = notches.map((notch) => ({
    edgeIndex: (n - 2 - notch.edgeIndex + n) % n,
    positionAlongEdge: 1 - notch.positionAlongEdge,
  }));
  return { polygon: mirrored, notches: remapped };
};

/** Corner-cutting subdivision: rounds every corner (curved seams from a few points). */
export const smoothPolygon = (polygon: Point[]): Point[] => {
  if (polygon.length < 3) return polygon;
  const out: Point[] = [];
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    out.push(
      { x: 0.75 * p.x + 0.25 * q.x, y: 0.75 * p.y + 0.25 * q.y },
      { x: 0.25 * p.x + 0.75 * q.x, y: 0.25 * p.y + 0.75 * q.y },
    );
  });
  return out;
};

const perpendicularDistance = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  return len === 0 ? Math.hypot(p.x - a.x, p.y - a.y) : Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
};

const simplifyOpen = (points: Point[], tolerance: number): Point[] => {
  if (points.length < 3) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i]!, first, last);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }
  if (maxDistance <= tolerance) return [first, last];
  return [...simplifyOpen(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplifyOpen(points.slice(index), tolerance)];
};

/** Douglas–Peucker on the closed outline: drops vertices that deviate less than `toleranceMm`. */
export const simplifyPolygon = (polygon: Point[], toleranceMm: number): Point[] => {
  if (polygon.length <= 3) return polygon;
  // Split at the vertex farthest from vertex 0 so both halves are open chains.
  let far = 1;
  let farDistance = 0;
  polygon.forEach((p, i) => {
    const d = Math.hypot(p.x - polygon[0]!.x, p.y - polygon[0]!.y);
    if (d > farDistance) {
      farDistance = d;
      far = i;
    }
  });
  const left = simplifyOpen(polygon.slice(0, far + 1), toleranceMm);
  const right = simplifyOpen([...polygon.slice(far), polygon[0]!], toleranceMm);
  const merged = [...left.slice(0, -1), ...right.slice(0, -1)];
  return merged.length >= 3 ? merged : polygon;
};

/** Snaps a value to the nearest multiple of `step` (step <= 0 disables). */
export const snapValue = (v: number, step: number): number => (step > 0 ? Math.round(v / step) * step : v);

/** Snaps to the grid, then to an existing vertex when one is within `vertexReach`. */
export const snapPoint = (
  p: Point,
  options: { gridMm: number; vertices?: Point[] | undefined; vertexReach?: number | undefined },
): Point => {
  const reach = options.vertexReach ?? 0;
  if (options.vertices && reach > 0) {
    const hit = nearestVertex(options.vertices, p, reach);
    if (hit) return options.vertices[hit.index]!;
  }
  return { x: snapValue(p.x, options.gridMm), y: snapValue(p.y, options.gridMm) };
};

/** Constrains `p` to the closest of 0/45/90…° directions from `from` (Shift while drawing). */
export const constrainAngle = (from: Point, p: Point, stepDegrees = 45): Point => {
  const dx = p.x - from.x;
  const dy = p.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return p;
  const step = (stepDegrees * Math.PI) / 180;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
};

/** Toggles a notch near `hit` (removes an existing one within 4 % of the edge, otherwise adds it). */
export const toggleNotch = (notches: Notch[], hit: Pick<EdgeHit, 'edgeIndex' | 't'>): Notch[] => {
  const existing = notches.findIndex(
    (n) => n.edgeIndex === hit.edgeIndex && Math.abs(n.positionAlongEdge - hit.t) < 0.04,
  );
  if (existing >= 0) return notches.filter((_, i) => i !== existing);
  return [...notches, { edgeIndex: hit.edgeIndex, positionAlongEdge: round(hit.t, 3) }];
};

export const pieceAreaCm2 = (polygon: Point[]): number => {
  let sum = 0;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    sum += a.x * b.y - b.x * a.y;
  });
  return Math.abs(sum / 2) / 100;
};

export const perimeterMm = (polygon: Point[]): number =>
  polygon.reduce((sum, a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    return sum + Math.hypot(b.x - a.x, b.y - a.y);
  }, 0);

/** True when two non-adjacent edges cross: the sewing line would be impossible to cut. */
export const hasSelfIntersection = (polygon: Point[]): boolean => {
  const n = polygon.length;
  const ccw = (a: Point, b: Point, c: Point): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      const a = polygon[i]!;
      const b = polygon[(i + 1) % n]!;
      const c = polygon[j]!;
      const d = polygon[(j + 1) % n]!;
      if (ccw(a, b, c) * ccw(a, b, d) < 0 && ccw(c, d, a) * ccw(c, d, b) < 0) return true;
    }
  }
  return false;
};

let draftCounter = 0;

/** A brand-new piece drawn in the studio. */
export const createDraftPiece = (polygon: Point[], name: string, versionId: string): PatternPieceDto => {
  draftCounter += 1;
  const bounds = getBounds(polygon);
  return withOutline(
    {
      id: `draft-${Date.now().toString(36)}-${draftCounter}`,
      versionId,
      name,
      dimensionsJson: {},
      fabricRecommendation: null,
      quantity: 1,
      grainlineJson: {
        angleDegrees: 90,
        originX: round(bounds.minX + bounds.width / 2),
        originY: round(bounds.minY + bounds.height / 2),
      },
      seamAllowanceCm: 1,
      notchesJson: [],
    },
    polygon,
    [],
  );
};

export const duplicatePiece = (piece: PatternPieceDto, name: string): PatternPieceDto => {
  draftCounter += 1;
  const polygon = translatePolygon(pieceOutline(piece), 20, 20);
  const grain = piece.grainlineJson;
  return {
    ...withOutline(piece, polygon),
    id: `draft-${Date.now().toString(36)}-${draftCounter}`,
    name,
    grainlineJson: grain ? { ...grain, originX: grain.originX + 20, originY: grain.originY + 20 } : null,
  };
};

export const isDraftPieceId = (id: string): boolean => id.startsWith('draft-');

/** Ray-casting point-in-polygon test. */
export const pointInPolygon = (polygon: Point[], p: Point): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

/**
 * Applies a new polygon to a piece while keeping its grainline at the same relative spot in the
 * bounding box (and turning it with the piece when `rotateDegrees` is given).
 */
export const transformPiece = (
  piece: PatternPieceDto,
  polygon: Point[],
  options: { notches?: Notch[] | undefined; rotateDegrees?: number | undefined } = {},
): PatternPieceDto => {
  const before = pieceOutline(piece);
  const next = withOutline(piece, polygon, options.notches ?? pieceNotches(piece));
  const grain = piece.grainlineJson;
  if (!grain || before.length === 0 || polygon.length === 0) return next;
  const a = getBounds(before);
  const b = getBounds(polygon);
  const rx = a.width > 0 ? (grain.originX - a.minX) / a.width : 0.5;
  const ry = a.height > 0 ? (grain.originY - a.minY) / a.height : 0.5;
  return {
    ...next,
    grainlineJson: {
      angleDegrees: round((grain.angleDegrees + (options.rotateDegrees ?? 0)) % 360, 1),
      originX: round(b.minX + rx * b.width),
      originY: round(b.minY + ry * b.height),
    },
  };
};
