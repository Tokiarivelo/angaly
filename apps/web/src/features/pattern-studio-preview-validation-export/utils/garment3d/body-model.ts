import { DEFAULT_TEMPLATE_ID, getBodyTemplate, type BodyTemplateId } from './body-templates';

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
  /** Stature (m); every landmark scales with it (1.70 m = the historical mannequin). */
  height: number;
  shoulderWidth: number;
  thigh: number;
  knee: number;
  ankle: number;
  upperArm: number;
  wrist: number;
  /** Torso cross-section depth / width at bust, waist, hip. */
  depth: { bust: number; waist: number; hip: number };
  headRadius: number;
  skin: string;
}

/** Stature the fixed landmark offsets below were drawn for. */
const REFERENCE_HEIGHT = 1.7;
/** Waist height ÷ stature, to deduce stature from HAUTEUR_TAILLE_SOL when it is given. */
const WAIST_HEIGHT_RATIO = 0.6;

const scaleOf = (body: Pick<BodyMeasurements, 'height'>): number => body.height / REFERENCE_HEIGHT;

const cm = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value / 100 : fallback;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * Reads the version's `measurements` (cm, engine keys), keeps every value in a plausible range, and
 * fills whatever is missing from the chosen morphology template (never from a fixed average).
 */
export const readBodyMeasurements = (
  measurements: Record<string, number> | null | undefined,
  templateId: BodyTemplateId | string | null | undefined = DEFAULT_TEMPLATE_ID,
): BodyMeasurements => {
  const m = measurements ?? {};
  const t = getBodyTemplate(templateId);
  const waistFloor = cm(m['HAUTEUR_TAILLE_SOL'], 0);
  const height = waistFloor > 0 ? clamp(waistFloor / WAIST_HEIGHT_RATIO, 1.2, 2.1) : t.height;
  return {
    bust: clamp(cm(m['TOUR_POITRINE'], t.bust), 0.5, 1.5),
    waist: clamp(cm(m['TOUR_TAILLE'], t.waist), 0.5, 1.4),
    hip: clamp(cm(m['TOUR_BASSIN'], t.hip), 0.6, 1.6),
    neck: clamp(cm(m['TOUR_COU'], t.neck), 0.26, 0.5),
    backLength: clamp(cm(m['LONGUEUR_DOS'], t.backLength), 0.3, 0.5),
    armLength: clamp(cm(m['LONGUEUR_BRAS'], t.armLength), 0.42, 0.72),
    height,
    shoulderWidth: clamp(cm(m['LARGEUR_EPAULE'], t.shoulderWidth), 0.26, 0.56),
    thigh: clamp(cm(m['TOUR_CUISSE'], t.thigh), 0.36, 0.85),
    knee: clamp(cm(m['TOUR_GENOU'], t.knee), 0.26, 0.55),
    ankle: clamp(cm(m['TOUR_CHEVILLE'], t.ankle), 0.15, 0.32),
    upperArm: clamp(cm(m['TOUR_BRAS'], t.upperArm), 0.17, 0.45),
    wrist: clamp(cm(m['TOUR_POIGNET'], t.wrist), 0.11, 0.24),
    depth: t.depth,
    headRadius: t.headRadius,
    skin: t.skin,
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

/** Scale of the fixed landmark offsets for a given stature. */
export const bodyScale = scaleOf;

export const bodyLandmarks = (body: BodyMeasurements): BodyLandmarks => {
  const s = scaleOf(body);
  const napeY = NAPE_Y * s;
  const waistY = napeY - body.backLength;
  return {
    napeY,
    shoulderY: napeY - 0.05 * s,
    bustY: napeY - 0.2 * s,
    waistY,
    hipY: waistY - 0.2 * s,
    crotchY: waistY - 0.3 * s,
    ankleY: 0.08 * s,
  };
};

/** Torso cross-sections from the nape down to the crotch, strictly decreasing in y. */
export const buildTorsoRings = (body: BodyMeasurements): BodyRing[] => {
  const l = bodyLandmarks(body);
  const s = scaleOf(body);
  const d = body.depth;
  const shoulderCircumference = body.bust * 0.88 * clamp(body.shoulderWidth / 0.35, 0.8, 1.4);
  const keys: Array<[number, number, number]> = [
    [l.napeY, body.neck, 1],
    [l.shoulderY, shoulderCircumference, 0.55],
    [l.napeY - 0.14 * s, body.bust * 0.97, d.bust - 0.12],
    [l.bustY, body.bust, d.bust],
    [l.bustY - 0.07 * s, body.bust * 0.9, d.bust],
    [l.waistY, body.waist, d.waist],
    [l.waistY - 0.1 * s, (body.waist + body.hip) / 2, (d.waist + d.hip) / 2],
    [l.hipY, body.hip, d.hip],
    [l.crotchY, body.hip * 0.95, d.hip + 0.02],
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
