import { DEFAULT_TEMPLATE_ID, getBodyTemplate } from './body-templates';

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
  templateId: string | null | undefined = DEFAULT_TEMPLATE_ID,
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
  /** Sagittal center offset (+z = front/bust, -z = back/gluteal curve). */
  cz?: number;
  /** Lateral center offset (usually 0). */
  cx?: number;
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

/**
 * Monotonic cubic Hermite interpolation between control stations (C1 continuous, strictly monotonic).
 */
const interpolateCubic = (
  keys: Array<[number, number, number, number]>,
  targetY: number,
): [number, number, number] => {
  if (targetY >= keys[0]![0]) return [keys[0]![1], keys[0]![2], keys[0]![3]];
  const last = keys[keys.length - 1]!;
  if (targetY <= last[0]) return [last[1], last[2], last[3]];

  let k = 0;
  while (k < keys.length - 2 && keys[k + 1]![0] > targetY) k += 1;

  const y0 = keys[k]![0];
  const y1 = keys[k + 1]![0];
  const t = Math.max(0, Math.min(1, (y0 - targetY) / (y0 - y1)));
  const t2 = t * t;
  const t3 = t2 * t;

  // Tangents calculated with finite differences:
  const getVal = (idx: number, prop: 1 | 2 | 3) => keys[Math.max(0, Math.min(keys.length - 1, idx))]![prop];
  const res: [number, number, number] = [0, 0, 0];

  for (let prop = 1; prop <= 3; prop += 1) {
    const p = prop as 1 | 2 | 3;
    const v0 = keys[k]![p];
    const v1 = keys[k + 1]![p];
    const m0 = (v1 - getVal(k - 1, p)) * 0.5;
    const m1 = (getVal(k + 2, p) - v0) * 0.5;

    // Hermite basis functions:
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    res[prop - 1] = h00 * v0 + h10 * m0 + h01 * v1 + h11 * m1;
  }
  return res;
};

/** Torso cross-sections from the nape down to the crotch, strictly decreasing in y. */
export const buildTorsoRings = (body: BodyMeasurements): BodyRing[] => {
  const l = bodyLandmarks(body);
  const s = scaleOf(body);
  const d = body.depth;
  const shoulderCircumference = body.bust * 0.88 * clamp(body.shoulderWidth / 0.35, 0.8, 1.4);

  // Key anatomical landmarks: [y, circumference, depthRatio, sagittalOffsetCz]
  const controlStations: Array<[number, number, number, number]> = [
    [l.napeY, body.neck, 1.0, 0.016 * s],
    [l.napeY - 0.025 * s, body.neck * 1.05, 0.9, 0.012 * s],
    [l.shoulderY, shoulderCircumference, 0.55, 0.004 * s],
    [l.shoulderY - 0.04 * s, body.bust * 0.94, 0.65, 0.012 * s],
    [l.bustY + 0.04 * s, body.bust * 0.98, d.bust - 0.06, 0.022 * s],
    [l.bustY, body.bust, d.bust, 0.028 * s],
    [l.bustY - 0.05 * s, body.bust * 0.91, d.bust - 0.02, 0.016 * s],
    [l.bustY - 0.11 * s, body.bust * 0.84, (d.bust + d.waist) / 2, 0.005 * s],
    [l.waistY + 0.04 * s, body.waist * 1.04, d.waist, -0.002 * s],
    [l.waistY, body.waist, d.waist, -0.006 * s],
    [l.waistY - 0.08 * s, body.waist * 0.55 + body.hip * 0.45, (d.waist * 0.55 + d.hip * 0.45), -0.016 * s],
    [l.hipY + 0.06 * s, body.waist * 0.25 + body.hip * 0.75, d.hip - 0.01, -0.022 * s],
    [l.hipY, body.hip, d.hip, -0.026 * s],
    [l.hipY - 0.05 * s, body.hip * 0.98, d.hip + 0.01, -0.018 * s],
    [l.crotchY, body.hip * 0.92, d.hip + 0.02, -0.008 * s],
  ];

  // We sample 32 finely spaced rings preserving exact key landmark heights
  // (napeY, shoulderY, bustY, waistY, hipY, crotchY) with smooth C1 interpolation between:
  const landmarkY = [l.napeY, l.shoulderY, l.bustY, l.waistY, l.hipY, l.crotchY];
  const stepsPerSection = [4, 7, 9, 7, 5]; // Sum of intervals = 31 intervals -> 32 rings

  const sampledRings: BodyRing[] = [];

  for (let sIdx = 0; sIdx < stepsPerSection.length; sIdx += 1) {
    const yTop = landmarkY[sIdx]!;
    const yBottom = landmarkY[sIdx + 1]!;
    const steps = stepsPerSection[sIdx]!;

    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const y = yTop + (yBottom - yTop) * t;
      const [circumference, ratio, cz] = interpolateCubic(controlStations, y);
      const { a, b } = ellipseSemiAxes(circumference, ratio);
      sampledRings.push({ y, a, b, cz });
    }
  }

  // Final crotch ring at exact crotchY:
  const [cCirc, cRatio, cCz] = interpolateCubic(controlStations, l.crotchY);
  const { a: cA, b: cB } = ellipseSemiAxes(cCirc, cRatio);
  sampledRings.push({ y: l.crotchY, a: cA, b: cB, cz: cCz });

  return sampledRings;
};

/** Linear interpolation of the semi-axes and sagittal offsets at height y (clamped to the ring range). */
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
      return {
        y,
        a: upper.a + (lower.a - upper.a) * t,
        b: upper.b + (lower.b - upper.b) * t,
        cz: (upper.cz ?? 0) + ((lower.cz ?? 0) - (upper.cz ?? 0)) * t,
        cx: (upper.cx ?? 0) + ((lower.cx ?? 0) - (upper.cx ?? 0)) * t,
      };
    }
  }
  return { ...last, y };
};

export interface Mesh3D {
  positions: Float32Array;
  indices: Uint32Array;
}

/** Closed loft through sculpted anatomical rings (the mannequin torso). */
export const loftRings = (rings: BodyRing[], radialSegments: number): Mesh3D => {
  const positions = new Float32Array(rings.length * radialSegments * 3);
  rings.forEach((ring, i) => {
    const cz = ring.cz ?? 0;
    const cx = ring.cx ?? 0;
    for (let j = 0; j < radialSegments; j += 1) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const o = (i * radialSegments + j) * 3;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      // Anatomical cross-section modulation based on anthropometric human body scans:
      let zExtra = 0;
      let xExtra = 0;

      // Symmetrical angle from anterior midline in [0, PI]:
      const phiSym = phi > Math.PI ? 2 * Math.PI - phi : phi;

      if (cz > 0.010 && cosP > 0) {
        // Bilateral bust contouring with natural sternum cleavage:
        // Breast apexes are positioned at phiSym ~= 0.48 rad (~27.5 deg from midline):
        const dPhi = Math.abs(phiSym - 0.48);
        const breastLobe = Math.exp(-(dPhi * dPhi) / (2 * 0.28 * 0.28));
        zExtra = cz * 0.42 * breastLobe * cosP;
        // Subtle lateral projection:
        xExtra = Math.sign(sinP) * cz * 0.08 * breastLobe;
      } else if (cz < -0.010 && cosP < 0) {
        // Posterior gluteal curve (two buttock mounds at the back):
        // Gluteal apexes are positioned at phiSym ~= PI - 0.55 rad (~148 deg):
        const dPhiG = Math.abs(phiSym - (Math.PI - 0.55));
        const gluteLobe = Math.exp(-(dPhiG * dPhiG) / (2 * 0.35 * 0.35));
        zExtra = cz * 0.38 * gluteLobe * (-cosP);
      } else if (cosP < 0 && cz >= -0.010) {
        // Subtle spinal furrow along posterior midline (erector spinae columns):
        const dSpine = Math.abs(phiSym - Math.PI);
        const spineFurrow = Math.exp(-(dSpine * dSpine) / (2 * 0.18 * 0.18));
        zExtra = -0.0025 * spineFurrow;
      }

      positions[o] = ring.a * sinP + cx + xExtra;
      positions[o + 1] = ring.y;
      positions[o + 2] = ring.b * cosP + cz + zExtra;
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
