import { armpitHeight, findJoint } from './body-envelope';
import { bodyLandmarks, bodyScale, ellipseCircumference, ringAt, type BodyMeasurements, type BodyRing } from './body-model';

/**
 * Fits the scanned-quality human base mesh (apps/web/public/models/human-base.glb, built from the
 * CC0 MakeHuman assets by scripts/build-human-base.py) to the customer's measurements.
 * Pure number crunching on typed arrays — no three.js — so it is unit-testable and the viewer only
 * uploads the result to a BufferGeometry.
 *
 * Pipeline: 1. morphs (gender / weight / muscle / age) → 2. vertical warp onto the model's landmarks →
 * 3. torso girths → 4. shoulder width → 5. arm length and girths → 6. leg girths → 7. neck girth.
 * Each step is a smooth shape-preserving map, so the scanned anatomy (collarbones, bust, joints) stays.
 */

export interface HumanBaseData {
  /** Base shape (adult woman), metres, feet at y = 0, +z = front. xyz interleaved. */
  positions: Float32Array;
  /** Triangle indices. */
  indices: Uint32Array;
  /** Per-vertex displacement for each named morph (same layout as `positions`). */
  morphs: Record<string, Float32Array>;
  /** 0 torso / legs / head … 1 arm (smooth). */
  armWeights: Float32Array;
  /** Heights (m) of floor, crotch, hip, waist, bust, nape, top for the female and male shapes. */
  landmarksFemale: number[];
  landmarksMale: number[];
  landmarksFemaleChild: number[];
  landmarksMaleChild: number[];
}

export interface HumanMorph {
  /** 0 = female shape, 1 = male shape. */
  gender: number;
  /** -1 = lean, 0 = average, +1 = heavy. */
  weight: number;
  /** 0..1 */
  muscle: number;
  /** 0 = adult, 1 = child (about 10 years). */
  age: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Chooses the morphs that bring the base mesh closest to the measurements (the ring fit does the rest). */
export const morphFor = (body: BodyMeasurements, templateId: string): HumanMorph => {
  const male = templateId.startsWith('HOMME') || templateId === 'ENFANT_GARCON';
  const child = templateId.startsWith('ENFANT');
  const waistRatio = body.waist / body.height;
  // Average waist ÷ stature: children have a relatively larger waist than adults.
  const reference = child ? 0.43 : male ? 0.48 : 0.41;
  const weight = clamp((waistRatio - reference) / 0.1, -1, 1);
  // Muscle tone: full for the muscular (costaud) build, high for the athletic one.
  const muscle = templateId.includes('COSTAUD') ? 1 : templateId.includes('ATHLETIQUE') ? 0.9 : male ? 0.3 : 0.1;
  // Children are much less dimorphic than adults (no bust, similar hips): their gender morph stays near
  // the middle (a full female morph gave the girl a bust).
  const gender = child ? (male ? 0.85 : 0.45) : male ? 1 : 0;
  return { gender, weight, muscle: child ? 0 : muscle, age: child ? 1 : 0 };
};

const applyMorphs = (data: HumanBaseData, morph: HumanMorph): Float32Array => {
  const out = new Float32Array(data.positions);
  const g = clamp(morph.gender, 0, 1);
  const weights: Array<[string, number]> = [
    ['gender', g],
    ['femaleHeavy', (1 - g) * Math.max(morph.weight, 0)],
    ['maleHeavy', g * Math.max(morph.weight, 0)],
    ['femaleLight', (1 - g) * Math.max(-morph.weight, 0)],
    ['maleLight', g * Math.max(-morph.weight, 0)],
    ['femaleMuscle', (1 - g) * clamp(morph.muscle, 0, 1)],
    ['maleMuscle', g * clamp(morph.muscle, 0, 1)],
    ['childFemale', (1 - g) * clamp(morph.age, 0, 1)],
    ['childMale', g * clamp(morph.age, 0, 1)],
  ];
  for (const [name, w] of weights) {
    const delta = data.morphs[name];
    if (!delta || w === 0) continue;
    for (let i = 0; i < out.length; i += 1) out[i]! += delta[i]! * w;
  }
  return out;
};

/** Monotone cubic (Fritsch–Carlson) interpolation through (xs → ys), xs increasing; linear beyond the ends. */
export const monotoneCubic = (xs: number[], ys: number[], x: number): number => {
  const last = xs.length - 1;
  const d = xs.slice(0, last).map((_, i) => (ys[i + 1]! - ys[i]!) / (xs[i + 1]! - xs[i]! || 1));
  if (x <= xs[0]!) return ys[0]! + (x - xs[0]!) * d[0]!;
  if (x >= xs[last]!) return ys[last]! + (x - xs[last]!) * d[last - 1]!;
  const m = xs.map((_, i) => {
    if (i === 0) return d[0]!;
    if (i === last) return d[last - 1]!;
    const a = d[i - 1]!;
    const b = d[i]!;
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b); // harmonic mean: no overshoot
  });
  let i = 0;
  while (i < last - 1 && x > xs[i + 1]!) i += 1;
  const h = xs[i + 1]! - xs[i]!;
  const t = (x - xs[i]!) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[i]! + (t3 - 2 * t2 + t) * h * m[i]! + (-2 * t3 + 3 * t2) * ys[i + 1]! + (t3 - t2) * h * m[i + 1]!
  );
};

interface Section {
  a: number;
  b: number;
  cx: number;
  cz: number;
  /** Convex-hull perimeter (m): what a tape measure reads. */
  perimeter: number;
}

const DIRECTIONS = 48;

/** Convex-hull perimeter of a cross-section (Cauchy: perimeter = π × mean width). */
const hullPerimeter = (xs: number[], zs: number[]): number => {
  if (xs.length < 3) return 0;
  let total = 0;
  for (let d = 0; d < DIRECTIONS; d += 1) {
    const t = (d / DIRECTIONS) * Math.PI;
    const ux = Math.cos(t);
    const uz = Math.sin(t);
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k < xs.length; k += 1) {
      const p = xs[k]! * ux + zs[k]! * uz;
      if (p < lo) lo = p;
      if (p > hi) hi = p;
    }
    total += hi - lo;
  }
  return (total / DIRECTIONS) * Math.PI;
};

const WINDOW = 0.012;

const measureSection = (pos: Float32Array, indices: number[], y: number, side: 0 | 1 | -1 = 0): Section | null => {
  const xs: number[] = [];
  const zs: number[] = [];
  for (const i of indices) {
    if (Math.abs(pos[i * 3 + 1]! - y) > WINDOW) continue;
    if (side !== 0 && Math.sign(pos[i * 3]!) !== side) continue;
    xs.push(pos[i * 3]!);
    zs.push(pos[i * 3 + 2]!);
  }
  if (xs.length < 6) return null;
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  return { a: (xMax - xMin) / 2, b: (zMax - zMin) / 2, cx: (xMax + xMin) / 2, cz: (zMax + zMin) / 2, perimeter: hullPerimeter(xs, zs) };
};

/** Taubin λ|μ smoothing (no shrinking) of the vertices whose mask is > 0, the step scaled by the mask. */
const smoothMasked = (pos: Float32Array, indices: Uint32Array, mask: Float32Array, iterations: number): void => {
  const n = mask.length;
  const neighbours: Array<Set<number>> = Array.from({ length: n }, () => new Set<number>());
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = indices[t + e]!;
      const b = indices[t + ((e + 1) % 3)]!;
      if (mask[a]! <= 0 && mask[b]! <= 0) continue;
      neighbours[a]!.add(b);
      neighbours[b]!.add(a);
    }
  }
  const next = new Float32Array(pos.length);
  const step = (factor: number): void => {
    next.set(pos);
    for (let i = 0; i < n; i += 1) {
      const around = neighbours[i]!;
      if (mask[i]! <= 0 || around.size === 0) continue;
      for (let c = 0; c < 3; c += 1) {
        let mean = 0;
        for (const j of around) mean += pos[j * 3 + c]!;
        next[i * 3 + c] = pos[i * 3 + c]! + factor * mask[i]! * (mean / around.size - pos[i * 3 + c]!);
      }
    }
    pos.set(next);
  };
  for (let it = 0; it < iterations; it += 1) {
    step(0.5);
    step(-0.53);
  }
};

export interface FitResult {
  positions: Float32Array;
  /** Hull perimeters (m) of the fitted torso at bust, waist and hip — for checks and the UI. */
  circumferences: { bust: number; waist: number; hip: number };
}

/** Indices of the vertices a region owns, from the arm weights and the (warped) height. */
const collect = (pos: Float32Array, arm: Float32Array, test: (y: number, aw: number, x: number) => boolean): number[] => {
  const out: number[] = [];
  for (let i = 0; i < arm.length; i += 1) if (test(pos[i * 3 + 1]!, arm[i]!, pos[i * 3]!)) out.push(i);
  return out;
};

interface Level {
  y: number;
  k: number;
  cx: number;
  cz: number;
}

/** [1 2 1] smoothing of a list of levels along the height, `passes` times (ends held). */
const smoothLevels = (levels: Level[], passes: number): Level[] => {
  let out = levels;
  for (let p = 0; p < passes; p += 1) {
    const prev = out;
    out = prev.map((c, i) => {
      const a = prev[Math.max(0, i - 1)]!;
      const b = prev[Math.min(prev.length - 1, i + 1)]!;
      return { y: c.y, k: (a.k + 2 * c.k + b.k) / 4, cx: (a.cx + 2 * c.cx + b.cx) / 4, cz: (a.cz + 2 * c.cz + b.cz) / 4 };
    });
  }
  return out;
};

/** Linear lookup in levels sorted by height, clamped at both ends. */
const levelAt = (levels: Level[], y: number): Level => {
  if (y <= levels[0]!.y) return levels[0]!;
  const last = levels[levels.length - 1]!;
  if (y >= last.y) return last;
  let i = 0;
  while (i < levels.length - 2 && levels[i + 1]!.y < y) i += 1;
  const a = levels[i]!;
  const b = levels[i + 1]!;
  const t = (y - a.y) / (b.y - a.y || 1);
  return { y, k: lerp(a.k, b.k, t), cx: lerp(a.cx, b.cx, t), cz: lerp(a.cz, b.cz, t) };
};

/**
 * Where the arm hinges (arm weight ≈ ½) sits this far inside the shoulder seam point (per metre of
 * stature scale): the deltoid lies beyond it. Calibrated by overlaying front views on reference bodies:
 * with 0 the shoulders were ~4 cm too wide.
 */
export const JOINT_INSET = 0.025;

/**
 * Relaxed standing pose, as fractions of the stature, read from reference front views (female, male):
 * the hands' centre and the knees' centre from the body's axis. The scan stands wider, arms higher.
 */
export const POSE = { hand: [0.182, 0.315], knee: [0.041, 0.058] } as const;

/** Rotates (vx, vy) — an angle measured from straight down towards +x — by `delta` radians. */
const rotateDown = (vx: number, vy: number, delta: number): [number, number] => {
  const c = Math.cos(delta);
  const sn = Math.sin(delta);
  return [vx * c - vy * sn, vy * c + vx * sn];
};

/**
 * Fits the scanned body to the measurements while keeping its anatomy. Every change is a smooth,
 * shape-preserving map: one isotropic factor per height (about the cross-section centre) for the torso
 * girths, a lateral factor for the shoulder width that carries the arms along rigidly, length and girth
 * about each arm's own axis, and girths about each leg's own centre. Nothing is clamped against the
 * garment: the garment drapes over this body instead (see garment-model.ts).
 */
export const fitHumanBody = (
  data: HumanBaseData,
  body: BodyMeasurements,
  rings: BodyRing[],
  morph: HumanMorph,
): FitResult => {
  const n = data.armWeights.length;
  const pos = applyMorphs(data, morph);
  const arm = data.armWeights;
  const l = bodyLandmarks(body);
  const s = bodyScale(body);

  // 1. Vertical warp through the reliable landmarks only: floor, crotch, top. The scan's waist, hip, bust
  //    and nape are estimates (narrowest/widest bands, a fixed nape ratio); pinning them squeezed and
  //    stretched bands of the body (+50 % waist → bust on the man, legs shortened) and made bulges at
  //    the buttock/thigh, the thighs and the knees. The girths (2) shape the waist, bust and hip instead.
  const g = clamp(morph.gender, 0, 1);
  const age = clamp(morph.age, 0, 1);
  const from = data.landmarksFemale.map((v, i) =>
    lerp(lerp(v, data.landmarksMale[i]!, g), lerp(data.landmarksFemaleChild[i]!, data.landmarksMaleChild[i]!, g), age),
  );
  const fromKeys = [from[0]!, from[1]!, from[6]!];
  const toKeys = [0, clamp(l.crotchY, 0.3 * body.height, 0.55 * body.height), body.height];
  const sizeRatio = body.height / (from[6] ?? 1);
  for (let i = 0; i < n; i += 1) {
    pos[i * 3 + 1] = monotoneCubic(fromKeys, toKeys, pos[i * 3 + 1]!);
    pos[i * 3]! *= sizeRatio;
    pos[i * 3 + 2]! *= sizeRatio;
  }

  // Pose values: the women's for children too (measured on a boy reference: hands at 0.17, knees at
  // 0.043 of the stature, like the woman's).
  const poseG = age > 0.5 ? 0 : g;
  const armpitY = armpitHeight(body);
  const mirror = (i: number): number => (pos[i * 3]! < 0 ? -1 : 1);

  // 2. Torso girths: one isotropic factor per height, crotch → armpit, about the section centre.
  //    Above the armpit it fades to 1 at the base of the neck; below the crotch it fades out over the
  //    upper thighs (the legs get their own fit in 5). The arms follow their joint rigidly.
  const torsoIdx = collect(pos, arm, (y, aw) => aw < 0.5 && y >= l.crotchY - 0.03 && y <= l.napeY + 0.03);
  const rawLevels: Level[] = [];
  for (let y = l.crotchY + 0.012; y <= armpitY + 1e-6; y += 0.01) {
    const section = measureSection(pos, torsoIdx, y);
    if (!section || section.perimeter <= 0) continue;
    const ring = ringAt(rings, y);
    const target = ellipseCircumference(ring.a, ring.b);
    rawLevels.push({ y, k: clamp(target / section.perimeter, 0.72, 1.4), cx: 0, cz: section.cz });
  }
  if (rawLevels.length > 1) {
    const levels = smoothLevels(rawLevels, 10);
    const kA = levels[levels.length - 1]!.k;
    const below = 0.12 * s;
    const torsoAt = (y: number): Level => {
      const level = levelAt(levels, y);
      if (y > armpitY) return { ...level, k: lerp(kA, 1, smooth((y - armpitY) / (l.napeY - armpitY))) };
      if (y < l.crotchY) return { ...level, k: lerp(1, level.k, 1 - smooth((l.crotchY - y) / below)) };
      return level;
    };
    const joint = findJoint(pos, arm, l.shoulderY, s);
    const jointLevel = joint ? torsoAt(joint.y) : null;
    // Below the crotch the hip factor must not be applied about the torso's centre and faded out: that
    // pushed the top of the thighs out and back and let them go lower down (a saddlebag bump and a crease
    // under the buttock). There, each leg is moved as a whole by what the crotch section does to its
    // centre, and its girth factor fades about the leg's own centre — identical at the crotch, no bump.
    const crotch = torsoAt(l.crotchY);
    const legLine = ([1, -1] as const).map((sign) => {
      const idx = collect(pos, arm, (y, aw, x) => aw < 0.05 && y < l.crotchY && (x < 0 ? -1 : 1) === sign);
      const centres: Level[] = [];
      for (let y = l.crotchY - below - 0.02; y <= l.crotchY; y += 0.01) {
        const section = measureSection(pos, idx, Math.min(y, l.crotchY - 0.012), sign);
        if (section) centres.push({ y, k: 1, cx: section.cx, cz: section.cz });
      }
      return centres.length > 1 ? smoothLevels(centres, 6) : null;
    });
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      const aw = arm[i]!;
      if (y < l.crotchY - below || y > l.napeY + 0.04 * s) continue;
      const x = pos[i * 3]!;
      const z = pos[i * 3 + 2]!;
      let nx: number;
      let nz: number;
      const line = legLine[x < 0 ? 1 : 0];
      if (y < l.crotchY && aw < 0.5 && line) {
        const c = levelAt(line, y);
        const f = lerp(1, crotch.k, 1 - smooth((l.crotchY - y) / below));
        nx = c.cx * crotch.k + (x - c.cx) * f;
        nz = crotch.cz + (c.cz - crotch.cz) * crotch.k + (z - c.cz) * f;
      } else {
        const level = torsoAt(y);
        nx = x * level.k;
        nz = level.cz + (z - level.cz) * level.k;
      }
      if (aw > 0 && joint && jointLevel) {
        // The arm moves with its joint instead of being scaled.
        const ax = x + mirror(i) * joint.x * (jointLevel.k - 1);
        const az = z + (joint.z - jointLevel.cz) * (jointLevel.k - 1);
        nx = lerp(nx, ax, aw);
        nz = lerp(nz, az, aw);
      }
      pos[i * 3] = nx;
      pos[i * 3 + 2] = nz;
    }
    // The rest of each leg follows the same shift (a wider pelvis carries the legs apart).
    for (const [side, line] of legLine.entries()) {
      if (!line) continue;
      const c = levelAt(line, l.crotchY - below);
      const dx = c.cx * (crotch.k - 1);
      const dz = (c.cz - crotch.cz) * (crotch.k - 1);
      for (let i = 0; i < n; i += 1) {
        if (arm[i]! >= 0.05 || pos[i * 3 + 1]! >= l.crotchY - below || (pos[i * 3]! < 0 ? 1 : 0) !== side) continue;
        pos[i * 3]! += dx;
        pos[i * 3 + 2]! += dz;
      }
    }
    for (let i = 0; i < n; i += 1) {
      // Arm vertices outside the torso band (the hands) still follow the joint.
      const y = pos[i * 3 + 1]!;
      if (!joint || !jointLevel || arm[i]! <= 0 || !(y < l.crotchY - below)) continue;
      pos[i * 3]! += arm[i]! * mirror(i) * joint.x * (jointLevel.k - 1);
      pos[i * 3 + 2]! += arm[i]! * (joint.z - jointLevel.cz) * (jointLevel.k - 1);
    }
  }

  // 3. Shoulder width: the shoulder line is widened/narrowed about the neck column and the arms are
  //    carried along rigidly, so the deltoids and the collarbones keep their scanned shape.
  const joint0 = findJoint(pos, arm, l.shoulderY, s);
  if (joint0) {
    const w = clamp((body.shoulderWidth / 2 - JOINT_INSET * s) / joint0.x, 0.9, 1.12);
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      const aw = arm[i]!;
      const band = smooth((y - (armpitY - 0.08 * s)) / (0.08 * s)) * (1 - smooth((y - l.napeY) / (0.04 * s)));
      const lateral = smooth((Math.abs(pos[i * 3]!) - 0.045 * s) / (0.05 * s));
      const torsoX = pos[i * 3]! * (1 + (w - 1) * band * lateral);
      const armX = pos[i * 3]! + mirror(i) * joint0.x * (w - 1);
      pos[i * 3] = lerp(torsoX, armX, aw);
    }
  }

  // 4. Arms: length about the joint along the arm's own axis, girth about that axis (upper arm → wrist).
  const joint = findJoint(pos, arm, l.shoulderY, s);
  if (joint) {
    const idx = collect(pos, arm, (_y, aw, x) => aw > 0.9 && x > 0);
    let mx = 0;
    let my = 0;
    for (const i of idx) {
      mx += pos[i * 3]! - joint.x;
      my += pos[i * 3 + 1]! - joint.y;
    }
    // The scanned A-pose arm hangs in the frontal plane: its axis is the mean direction from the joint.
    const len = Math.hypot(mx, my) || 1;
    const dir = { x: mx / len, y: my / len };
    const local = (i: number) => {
      const px = Math.abs(pos[i * 3]!) - joint.x;
      const py = pos[i * 3 + 1]! - joint.y;
      const t = px * dir.x + py * dir.y;
      return { t, rx: px - t * dir.x, ry: py - t * dir.y, rz: pos[i * 3 + 2]! - joint.z };
    };
    let reach = 0;
    for (const i of idx) reach = Math.max(reach, local(i).t);
    const hand = 0.17 * s;
    const L = clamp((body.armLength + hand) / Math.max(reach, 1e-3), 0.9, 1.1);
    const girthAt = (t: number): number => {
      const xs: number[] = [];
      const zs: number[] = [];
      for (const i of idx) {
        const p = local(i);
        if (Math.abs(p.t - t) > 0.012) continue;
        // Cross-section coordinates: across the axis in the frontal plane, and depth.
        xs.push(p.rx * -dir.y + p.ry * dir.x);
        zs.push(p.rz);
      }
      return hullPerimeter(xs, zs);
    };
    const tUpper = 0.28 * (reach - hand);
    const tWrist = reach - hand;
    const pu = girthAt(tUpper);
    const pw = girthAt(tWrist - 0.01);
    const gu = pu > 0 ? clamp(body.upperArm / pu, 0.82, 1.3) : 1;
    const gw = pw > 0 ? clamp(body.wrist / pw, 0.85, 1.2) : 1;
    const girth = (t: number): number => {
      if (t < tUpper) return lerp(1, gu, smooth(t / tUpper));
      if (t < tWrist) return lerp(gu, gw, smooth((t - tUpper) / (tWrist - tUpper)));
      return lerp(gw, 1, smooth((t - tWrist) / 0.05));
    };
    // Pose: the arm swings about the joint, in the frontal plane, until the hand's centre reaches the
    // reference distance from the body's axis. Each vertex turns by the angle × its arm weight, so the
    // armpit and the deltoid bend smoothly instead of shearing.
    const handDistance = (reach - hand / 2) * L;
    const targetX = lerp(POSE.hand[0], POSE.hand[1], poseG) * body.height;
    const current = Math.atan2(dir.x, -dir.y);
    const wanted = Math.asin(clamp((targetX - joint.x) / Math.max(handDistance, 1e-3), 0.05, 0.95));
    const swing = clamp(wanted - current, -0.6, 0.2);
    for (let i = 0; i < n; i += 1) {
      const aw = arm[i]!;
      if (aw <= 0) continue;
      const p = local(i);
      const k = girth(Math.max(0, p.t));
      const [vx, vy] = rotateDown(p.t * L * dir.x + p.rx * k, p.t * L * dir.y + p.ry * k, swing * smooth(aw));
      const nx = joint.x + vx;
      const ny = joint.y + vy;
      const nz = joint.z + p.rz * k;
      pos[i * 3] = mirror(i) * lerp(Math.abs(pos[i * 3]!), nx, aw);
      pos[i * 3 + 1] = lerp(pos[i * 3 + 1]!, ny, aw);
      pos[i * 3 + 2] = lerp(pos[i * 3 + 2]!, nz, aw);
    }
  }

  // 5. Legs: girths at the thigh, knee and ankle, each leg scaled about its own (smoothed) centre line.
  //    The legs are never moved sideways: the stance of the scan is kept.
  const thighY = l.crotchY - 0.05 * s;
  const kneeY = 0.285 * body.height;
  const ankleY = l.ankleY + 0.015 * s;
  for (const sign of [1, -1] as const) {
    const idx = collect(pos, arm, (y, aw, x) => aw < 0.05 && y < l.crotchY + 0.1 * s && (x < 0 ? -1 : 1) === sign);
    const factor = (y: number, girth: number): number => {
      const section = measureSection(pos, idx, y, sign);
      return section && section.perimeter > 0 ? clamp(girth / section.perimeter, 0.85, 1.2) : 1;
    };
    const controls = [
      [ankleY, factor(ankleY, body.ankle)],
      [kneeY, factor(kneeY, body.knee)],
      [thighY, factor(thighY, body.thigh)],
    ] as const;
    const fAt = (y: number): number => {
      const f = monotoneCubic(controls.map((c) => c[0]), controls.map((c) => c[1]), clamp(y, ankleY, thighY));
      // A long fade into the hip: a short one pinched the thigh under the buttock (a saddlebag above it).
      if (y > thighY) return lerp(f, 1, smooth((y - thighY) / (l.crotchY + 0.1 * s - thighY)));
      if (y < ankleY) return lerp(1, f, smooth(y / ankleY));
      return f;
    };
    const centres: Level[] = [];
    for (let y = 0.02 * s; y <= l.crotchY; y += 0.02) {
      const section = measureSection(pos, idx, y, sign);
      if (section) centres.push({ y, k: 1, cx: section.cx, cz: section.cz });
    }
    if (centres.length < 2) continue;
    const line = smoothLevels(centres, 8);
    for (const i of idx) {
      const y = pos[i * 3 + 1]!;
      // Above the crotch both halves of the pelvis meet on the midline: the factor fades to 1 there.
      const midline = y > l.crotchY ? smooth(Math.abs(pos[i * 3]!) / (0.05 * s)) : 1;
      const f = 1 + (fAt(y) - 1) * midline;
      const c = levelAt(line, y);
      pos[i * 3] = c.cx + (pos[i * 3]! - c.cx) * f;
      pos[i * 3 + 2] = c.cz + (pos[i * 3 + 2]! - c.cz) * f;
    }
  }

  // 5b. Stance: each leg swings about its hip joint (frontal plane) until the knee's centre reaches the
  //     reference distance from the axis — never so far that the knees would cross. The rotation fades
  //     out over the upper thigh, so the buttock, the hip and the crotch keep their shape.
  // Both legs are collected before either moves: a foot swung across the midline must not be taken
  // for the other leg.
  const legs = ([1, -1] as const).map((sign) => ({
    sign,
    idx: collect(pos, arm, (y, aw, x) => aw < 0.05 && y < l.crotchY + 0.06 * s && (x < 0 ? -1 : 1) === sign),
  }));
  for (const { sign, idx } of legs) {
    const knee = measureSection(pos, idx, kneeY, sign);
    const foot = measureSection(pos, idx, 0.025 * s, sign);
    if (!knee) continue;
    const pivot = { x: 0.085 * s, y: l.crotchY + 0.08 * s };
    const kneeX = Math.abs(knee.cx);
    const clearance = 0.004 * body.height;
    let angle = Math.atan2(kneeX - lerp(POSE.knee[0], POSE.knee[1], poseG) * body.height, pivot.y - kneeY);
    // Neither the knees nor the feet may meet: the inner edges keep a few millimetres from the axis.
    const room = (inner: number, y: number): number => Math.atan2(Math.max(0, inner - clearance), pivot.y - y);
    angle = Math.min(angle, room(kneeX - knee.a, kneeY));
    if (foot) angle = Math.min(angle, room(Math.abs(foot.cx) - foot.a, 0.025 * s));
    angle = clamp(angle, -0.15, 0.25);
    if (Math.abs(angle) < 1e-4) continue;
    const top = l.crotchY + 0.05 * s;
    const full = l.crotchY - 0.12 * s;
    for (const i of idx) {
      const y = pos[i * 3 + 1]!;
      const w = 1 - smooth((y - full) / (top - full));
      if (w <= 0) continue;
      const [vx, vy] = rotateDown(sign * pos[i * 3]! - pivot.x, y - pivot.y, -angle * w);
      pos[i * 3] = sign * (pivot.x + vx);
      pos[i * 3 + 1] = pivot.y + vy;
    }
  }
  // Back on the floor (the swing tilts the feet by a few millimetres).
  let lowest = Infinity;
  for (let i = 0; i < n; i += 1) lowest = Math.min(lowest, pos[i * 3 + 1]!);
  if (Number.isFinite(lowest) && Math.abs(lowest) < 0.03) for (let i = 0; i < n; i += 1) pos[i * 3 + 1]! -= lowest;

  // 6. Neck girth (a mild factor on the neck column only; the jaw and the trapezius keep their shape).
  const neckIdx = collect(pos, arm, (y, aw, x) => aw < 0.5 && Math.abs(x) < 0.08 * s && Math.abs(y - (l.napeY + 0.03 * s)) < 0.03);
  const neck = measureSection(pos, neckIdx, l.napeY + 0.03 * s);
  if (neck && neck.perimeter > 0) {
    const k = clamp(body.neck / neck.perimeter, 0.9, 1.12);
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      if (arm[i]! >= 0.5) continue;
      const w =
        smooth((y - (l.napeY - 0.01 * s)) / (0.03 * s)) *
        (1 - smooth((y - (l.napeY + 0.05 * s)) / (0.03 * s))) *
        (1 - smooth((Math.abs(pos[i * 3]!) - 0.05 * s) / (0.03 * s)));
      if (w <= 0) continue;
      const f = 1 + (k - 1) * w;
      pos[i * 3]! *= f;
      pos[i * 3 + 2] = neck.cz + (pos[i * 3 + 2]! - neck.cz) * f;
    }
  }

  // 6b. Children: a relatively larger head (≈ 1/7 of the stature at 10 years, against 1/7.7 on the
  //     scan's child shape). The head grows about the base of the neck and the neck gets shorter to keep
  //     the stature (children have short necks): the torso, the nape and every garment landmark stay.
  if (age > 0) {
    const k = 1 + 0.08 * age;
    const neckY = l.napeY + 0.02 * s;
    let neckZ = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      if (arm[i]! < 0.5 && Math.abs(pos[i * 3 + 1]! - neckY) < 0.01 && Math.abs(pos[i * 3]!) < 0.05 * s) {
        neckZ += pos[i * 3 + 2]!;
        count += 1;
      }
    }
    neckZ = count ? neckZ / count : 0;
    let top = -Infinity;
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      const w = arm[i]! < 0.5 ? smooth((y - neckY) / (0.06 * s)) : 0;
      if (w > 0) {
        const f = 1 + (k - 1) * w;
        pos[i * 3]! *= f;
        pos[i * 3 + 1] = neckY + (y - neckY) * f;
        pos[i * 3 + 2] = neckZ + (pos[i * 3 + 2]! - neckZ) * f;
      }
      top = Math.max(top, pos[i * 3 + 1]!);
    }
    const overflow = top - body.height;
    for (let i = 0; i < n; i += 1) {
      const y = pos[i * 3 + 1]!;
      if (arm[i]! >= 0.5 || y <= l.napeY) continue;
      pos[i * 3 + 1] = y - overflow * smooth((y - l.napeY) / (0.05 * s));
    }
  }

  // 7. Polish: the hips, buttocks and legs (ankle → waist) are smoothed without shrinking, so the
  //    buttock–thigh fold and the knees read as one continuous skin after all the fits above.
  const polish = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    if (arm[i]! >= 0.05) continue;
    const y = pos[i * 3 + 1]!;
    polish[i] = 0.8 * smooth((y - (l.ankleY + 0.02 * s)) / (0.06 * s)) * (1 - smooth((y - (l.hipY + 0.04 * s)) / (0.1 * s)));
  }
  smoothMasked(pos, data.indices, polish, 6);

  const at = (y: number): number => measureSection(pos, torsoIdx, y)?.perimeter ?? 0;
  return { positions: pos, circumferences: { bust: at(l.bustY), waist: at(l.waistY), hip: at(l.hipY) } };
};
