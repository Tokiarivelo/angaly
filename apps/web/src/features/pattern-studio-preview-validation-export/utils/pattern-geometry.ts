/**
 * Pure 2D geometry helpers for the technical pattern view (millimetres, y axis pointing down like SVG).
 * No React, no DOM: everything here is unit-tested.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** Drops the closing point when the outline repeats its first point (the engine's convention). */
export const openPolygon = (outline: Point[]): Point[] => {
  const first = outline[0];
  const last = outline[outline.length - 1];
  if (outline.length > 1 && first?.x === last?.x && first?.y === last?.y) {
    return outline.slice(0, -1);
  }
  return outline;
};

export const getBounds = (points: Point[]): Bounds => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};

/** Signed area (shoelace). Positive = clockwise in SVG space (y down). */
export const signedArea = (points: Point[]): number => {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
};

export const polygonAreaCm2 = (points: Point[]): number => Math.abs(signedArea(points)) / 100;

export interface Edge {
  index: number;
  from: Point;
  to: Point;
  lengthMm: number;
  midpoint: Point;
  /** Unit normal pointing OUT of the polygon. */
  normal: Point;
}

export const getEdges = (polygon: Point[]): Edge[] => {
  const clockwise = signedArea(polygon) > 0;
  return polygon.map((from, index) => {
    const to = polygon[(index + 1) % polygon.length]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lengthMm = Math.hypot(dx, dy);
    const ux = lengthMm === 0 ? 0 : dx / lengthMm;
    const uy = lengthMm === 0 ? 0 : dy / lengthMm;
    // In y-down space a clockwise polygon has its outside on the left of travel: (uy, -ux).
    const normal = clockwise ? { x: uy, y: -ux } : { x: -uy, y: ux };
    return {
      index,
      from,
      to,
      lengthMm,
      midpoint: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
      normal,
    };
  });
};

const intersectLines = (p1: Point, d1: Point, p2: Point, d2: Point): Point | null => {
  const cross = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(cross) < 1e-9) return null;
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / cross;
  return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
};

/**
 * Cutting line: the sewing line offset outward by the seam allowance (mitered corners, capped so very
 * sharp angles cannot shoot out). Degenerate edges are skipped.
 */
export const offsetPolygon = (polygon: Point[], distanceMm: number): Point[] => {
  if (distanceMm === 0 || polygon.length < 3) return polygon;
  const edges = getEdges(polygon).filter((e) => e.lengthMm > 1e-6);
  const maxMiter = Math.abs(distanceMm) * 3;

  return edges.map((edge, i) => {
    const prev = edges[(i - 1 + edges.length) % edges.length]!;
    const a1 = { x: prev.from.x + prev.normal.x * distanceMm, y: prev.from.y + prev.normal.y * distanceMm };
    const d1 = { x: prev.to.x - prev.from.x, y: prev.to.y - prev.from.y };
    const a2 = { x: edge.from.x + edge.normal.x * distanceMm, y: edge.from.y + edge.normal.y * distanceMm };
    const d2 = { x: edge.to.x - edge.from.x, y: edge.to.y - edge.from.y };

    const corner = intersectLines(a1, d1, a2, d2);
    if (!corner || Math.hypot(corner.x - edge.from.x, corner.y - edge.from.y) > maxMiter) {
      // Parallel or too sharp: fall back to the plain offset of the vertex along the edge normal.
      return a2;
    }
    return corner;
  });
};

export interface NotchMark {
  /** Point on the edge. */
  at: Point;
  /** Unit vector pointing into the seam allowance (outward). */
  direction: Point;
}

export const getNotchMarks = (
  polygon: Point[],
  notches: Array<{ positionAlongEdge: number; edgeIndex: number }> | null | undefined,
): NotchMark[] => {
  if (!notches || polygon.length < 3) return [];
  const edges = getEdges(polygon);
  const marks: NotchMark[] = [];
  for (const notch of notches) {
    const edge = edges[notch.edgeIndex];
    if (!edge) continue;
    const t = Math.min(1, Math.max(0, notch.positionAlongEdge));
    marks.push({
      at: {
        x: edge.from.x + (edge.to.x - edge.from.x) * t,
        y: edge.from.y + (edge.to.y - edge.from.y) * t,
      },
      direction: edge.normal,
    });
  }
  return marks;
};

/**
 * A piece cut on the fold has one long vertical edge on its left bound (the engine places centre-front /
 * centre-back at x = minX) and is cut once. Returns that edge, or null.
 */
export const findFoldEdge = (polygon: Point[], quantity: number): Edge | null => {
  if (quantity !== 1 || polygon.length < 3) return null;
  const bounds = getBounds(polygon);
  if (bounds.height === 0) return null;
  const candidate = getEdges(polygon).find(
    (e) =>
      Math.abs(e.from.x - bounds.minX) < 1e-6 &&
      Math.abs(e.to.x - bounds.minX) < 1e-6 &&
      e.lengthMm >= bounds.height * 0.5,
  );
  return candidate ?? null;
};

/** Largest "nice" length (1, 2, 5 × 10ⁿ) not exceeding `maxMm`, for scale bars. */
export const niceScaleLengthMm = (maxMm: number): number => {
  if (maxMm <= 0) return 10;
  const exponent = Math.floor(Math.log10(maxMm));
  const base = 10 ** exponent;
  for (const factor of [5, 2, 1]) {
    if (factor * base <= maxMm) return factor * base;
  }
  return base;
};

export const formatCm = (mm: number): string => {
  const cm = mm / 10;
  return `${cm >= 100 ? Math.round(cm) : Math.round(cm * 10) / 10} cm`.replace('.', ',');
};

export interface PlacedPiece<T> {
  item: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Shelf packing of bounding boxes into rows of at most `maxRowWidth`, for the overview sheet. */
export const layoutBoxes = <T>(
  items: Array<{ item: T; width: number; height: number }>,
  maxRowWidth: number,
  gap: number,
): { placed: PlacedPiece<T>[]; width: number; height: number } => {
  const placed: PlacedPiece<T>[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let totalWidth = 0;

  for (const { item, width, height } of items) {
    if (x > 0 && x + width > maxRowWidth) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    placed.push({ item, x, y, width, height });
    x += width + gap;
    rowHeight = Math.max(rowHeight, height);
    totalWidth = Math.max(totalWidth, x - gap);
  }

  return { placed, width: totalWidth, height: y + rowHeight };
};
