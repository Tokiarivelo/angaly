/**
 * Parametric mannequin built from the customer's measurements (metres, y up, +z = front).
 * Pure functions, no three.js: the viewer only turns these numbers into meshes.
 */

export interface BodyMeasurements {
  bust: number;
  waist: number;
  hip: number;
  neck: number;
  /** Nape-to-waist length. */
  backLength: number;
  armLength: number;
}

const DEFAULTS = { bust: 0.88, waist: 0.68, hip: 0.94, neck: 0.36, backLength: 0.4, armLength: 0.58 };

const cm = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value / 100 : fallback;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Reads the version's `measurements` (cm, engine keys) and keeps every value in a plausible range. */
export const readBodyMeasurements = (
  measurements: Record<string, number> | null | undefined,
): BodyMeasurements => {
  const m = measurements ?? {};
  return {
    bust: clamp(cm(m['TOUR_POITRINE'], DEFAULTS.bust), 0.6, 1.5),
    waist: clamp(cm(m['TOUR_TAILLE'], DEFAULTS.waist), 0.5, 1.4),
    hip: clamp(cm(m['TOUR_BASSIN'], DEFAULTS.hip), 0.6, 1.6),
    neck: clamp(cm(m['TOUR_COU'], DEFAULTS.neck), 0.28, 0.5),
    backLength: clamp(cm(m['LONGUEUR_DOS'], DEFAULTS.backLength), 0.32, 0.5),
    armLength: clamp(cm(m['LONGUEUR_BRAS'], DEFAULTS.armLength), 0.45, 0.72),
  };
};

/** Ramanujan's approximation of an ellipse perimeter. */
export const ellipseCircumference = (a: number, b: number): number =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Semi-axes (a = width, b = depth) of an ellipse of given circumference and b/a ratio. */
export const ellipseSemiAxes = (circumference: number, depthRatio: number): { a: number; b: number } => {
  const r = depthRatio;
  const a = circumference / (Math.PI * (3 * (1 + r) - Math.sqrt((3 + r) * (1 + 3 * r))));
  return { a, b: a * r };
};

export interface BodyRing {
  y: number;
  a: number;
  b: number;
}

export interface BodyLandmarks {
  napeY: number;
  shoulderY: number;
  bustY: number;
  waistY: number;
  hipY: number;
  crotchY: number;
  ankleY: number;
}

export const NAPE_Y = 1.42;

export const bodyLandmarks = (body: BodyMeasurements): BodyLandmarks => {
  const waistY = NAPE_Y - body.backLength;
  return {
    napeY: NAPE_Y,
    shoulderY: NAPE_Y - 0.05,
    bustY: NAPE_Y - 0.2,
    waistY,
    hipY: waistY - 0.2,
    crotchY: waistY - 0.3,
    ankleY: 0.08,
  };
};

/** Torso cross-sections from the nape down to the crotch, strictly decreasing in y. */
export const buildTorsoRings = (body: BodyMeasurements): BodyRing[] => {
  const l = bodyLandmarks(body);
  const keys: Array<[number, number, number]> = [
    [l.napeY, body.neck, 1],
    [l.shoulderY, body.bust * 0.88, 0.55],
    [l.napeY - 0.14, body.bust * 0.97, 0.66],
    [l.bustY, body.bust, 0.78],
    [l.bustY - 0.07, body.bust * 0.9, 0.78],
    [l.waistY, body.waist, 0.74],
    [l.waistY - 0.1, (body.waist + body.hip) / 2, 0.76],
    [l.hipY, body.hip, 0.78],
    [l.crotchY, body.hip * 0.95, 0.8],
  ];
  return keys.map(([y, circumference, ratio]) => {
    const { a, b } = ellipseSemiAxes(circumference, ratio);
    return { y, a, b };
  });
};

/** Linear interpolation of the semi-axes at height y (clamped to the ring range). */
export const ringAt = (rings: BodyRing[], y: number): BodyRing => {
  const first = rings[0]!;
  const last = rings[rings.length - 1]!;
  if (y >= first.y) return { ...first, y };
  if (y <= last.y) return { ...last, y };
  for (let i = 0; i < rings.length - 1; i += 1) {
    const upper = rings[i]!;
    const lower = rings[i + 1]!;
    if (y <= upper.y && y >= lower.y) {
      const t = (upper.y - y) / (upper.y - lower.y);
      return { y, a: upper.a + (lower.a - upper.a) * t, b: upper.b + (lower.b - upper.b) * t };
    }
  }
  return { ...last, y };
};

export interface Mesh3D {
  positions: Float32Array;
  indices: Uint32Array;
}

/** Closed loft through elliptical rings (the mannequin torso). */
export const loftRings = (rings: BodyRing[], radialSegments: number): Mesh3D => {
  const positions = new Float32Array(rings.length * radialSegments * 3);
  rings.forEach((ring, i) => {
    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const o = (i * radialSegments + j) * 3;
      positions[o] = ring.a * Math.sin(phi);
      positions[o + 1] = ring.y;
      positions[o + 2] = ring.b * Math.cos(phi);
    }
  });

  const indices: number[] = [];
  for (let i = 0; i < rings.length - 1; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const a = i * radialSegments + j;
      const b = i * radialSegments + next;
      const c = (i + 1) * radialSegments + j;
      const d = (i + 1) * radialSegments + next;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions, indices: Uint32Array.from(indices) };
};
