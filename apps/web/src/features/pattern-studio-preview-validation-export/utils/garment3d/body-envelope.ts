import { bodyLandmarks, bodyScale, loftRings, type BodyMeasurements, type BodyRing } from './body-model';

/**
 * The body as the fabric "sees" it: for every height (torso, each leg) and every distance along each
 * arm, the support function of the convex hull of the skin cross-section. A taut fabric bridges every
 * hollow (between the breasts, between the legs, under the arm), so the hull — not the skin — is what a
 * garment rests on. Support functions are also what makes the drape cheap: an offset by `d` adds `d`
 * everywhere, the perimeter is the mean support times 2π (Cauchy), and the union of two convex shapes
 * is the pointwise max. Pure numbers, no three.js.
 */

/** Directions per cross-section. θ_k = 2πk / ANGLES, u(θ) = (sin θ, cos θ) in the (x, z) plane, θ = 0 → front. */
export const ANGLES = 96;
const SIN = Float32Array.from({ length: ANGLES }, (_, k) => Math.sin((2 * Math.PI * k) / ANGLES));
const COS = Float32Array.from({ length: ANGLES }, (_, k) => Math.cos((2 * Math.PI * k) / ANGLES));

export type Support = Float32Array;
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LimbFrame {
  /** Shoulder joint (t = 0). */
  start: Vec3;
  /** Unit axis, from the shoulder towards the hand. */
  dir: Vec3;
  /** Cross-section basis: `front` ⟂ dir, pointing forwards; `side` = dir × front, pointing away from the body. */
  front: Vec3;
  side: Vec3;
  length: number;
  /** Distance of the wrist (the narrowest section before the hand); beyond it the hand is ignored. */
  wrist: number;
  /** Support of the cross-section at distance t along the axis, in (side, front) coordinates. */
  support: (t: number) => Support;
  /**
   * Support of the shoulder cap: every arm point from ~10 cm above the joint (the deltoid, which rises
   * over it) to 3 cm below, projected along the axis. A sleeve cap goes round all of it.
   */
  cap?: Support;
}

export interface BodyEnvelope {
  /** The torso axis: x = 0, z = axisZ. */
  axisZ: number;
  crotchY: number;
  armpitY: number;
  /** Support of the torso (plus both legs below the crotch) at height y, about (0, axisZ), symmetric. */
  torso: (y: number) => Support;
  /** Centre of the left (+x) leg at height y; the right leg is its mirror image. */
  legCentre: (y: number) => { x: number; z: number };
  /** Support of the left (+x) leg at height y, about legCentre(y). */
  leg: (y: number) => Support;
  /** Left (+x) arm; the right arm is its mirror image. Null when the body has no arm data. */
  arm: LimbFrame | null;
  /**
   * Top of the shoulders at lateral distance |x| (above the armpit): height and depth of the ridge a
   * shoulder seam rests on. Null outside the measured range.
   */
  shoulder: (x: number) => { y: number; z: number } | null;
  /**
   * Height of the skin top above the armpit at (x, z) — the shoulders' slopes seen from above — or null
   * where no skin is there. Absent on envelopes built without a mesh.
   */
  top?: (x: number, z: number) => number | null;
}

/** Region of each point: what the fabric of a torso, a trouser leg or a sleeve rests on. */
export const REGION = { NONE: 0, TORSO: 1, LEG: 2, ARM: 3 } as const;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const supportOf = (xs: number[], zs: number[], cx: number, cz: number): Support | null => {
  if (xs.length < 3) return null;
  const h = new Float32Array(ANGLES).fill(-Infinity);
  for (let p = 0; p < xs.length; p += 1) {
    const dx = xs[p]! - cx;
    const dz = zs[p]! - cz;
    for (let k = 0; k < ANGLES; k += 1) {
      const v = dx * SIN[k]! + dz * COS[k]!;
      if (v > h[k]!) h[k] = v;
    }
  }
  return h;
};

/** Mirror-symmetric support (left/right): the max of h(θ) and h(−θ). */
const symmetric = (h: Support): Support => {
  const out = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) out[k] = Math.max(h[k]!, h[(ANGLES - k) % ANGLES]!);
  return out;
};

/** Levels of supports along a parameter, filled from the nearest non-empty level, linearly interpolated. */
const levelSampler = (start: number, step: number, levels: Array<Support | null>): ((v: number) => Support) => {
  const filled: Support[] = [];
  let last: Support | null = null;
  for (const s of levels) {
    if (s) last = s;
    filled.push((s ?? last) as Support);
  }
  // Leading gaps take the first non-empty level.
  const first = filled.find(Boolean) ?? new Float32Array(ANGLES);
  for (let i = 0; i < filled.length && !filled[i]; i += 1) filled[i] = first;
  return (v: number): Support => {
    const f = clamp((v - start) / step, 0, filled.length - 1);
    const i = Math.min(filled.length - 2, Math.floor(f));
    if (i < 0) return filled[0]!;
    const t = f - i;
    const a = filled[i]!;
    const b = filled[i + 1]!;
    const out = new Float32Array(ANGLES);
    for (let k = 0; k < ANGLES; k += 1) out[k] = a[k]! + (b[k]! - a[k]!) * t;
    return out;
  };
};

const LEVEL = 0.01;
const WINDOW = 0.009;

export interface EnvelopeInput {
  positions: Float32Array;
  region: Uint8Array;
  /** Left (+x) shoulder joint, where the arm hinges (null: no arm). */
  joint: Vec3 | null;
  crotchY: number;
  armpitY: number;
}

export const buildEnvelope = ({ positions, region, joint, crotchY, armpitY }: EnvelopeInput): BodyEnvelope => {
  const n = region.length;
  // Bucket the torso/leg points by height level.
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i += 1) {
    if (region[i] !== REGION.TORSO && region[i] !== REGION.LEG) continue;
    minY = Math.min(minY, positions[i * 3 + 1]!);
    maxY = Math.max(maxY, positions[i * 3 + 1]!);
  }
  if (!Number.isFinite(minY)) {
    minY = 0;
    maxY = 1;
  }
  const count = Math.max(2, Math.ceil((maxY - minY) / LEVEL) + 1);
  const buckets: number[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < n; i += 1) {
    if (region[i] !== REGION.TORSO && region[i] !== REGION.LEG) continue;
    buckets[clamp(Math.round((positions[i * 3 + 1]! - minY) / LEVEL), 0, count - 1)]!.push(i);
  }
  const reach = Math.ceil(WINDOW / LEVEL);
  const around = (level: number, keep: (i: number) => boolean): number[] => {
    const out: number[] = [];
    for (let b = Math.max(0, level - reach); b <= Math.min(count - 1, level + reach); b += 1) {
      for (const i of buckets[b]!) if (keep(i)) out.push(i);
    }
    return out;
  };

  // Torso axis: middle of the waist-level depth range.
  let zLo = Infinity;
  let zHi = -Infinity;
  for (const i of around(clamp(Math.round((crotchY + 0.2 - minY) / LEVEL), 0, count - 1), (i) => region[i] === REGION.TORSO)) {
    zLo = Math.min(zLo, positions[i * 3 + 2]!);
    zHi = Math.max(zHi, positions[i * 3 + 2]!);
  }
  const axisZ = Number.isFinite(zLo) ? (zLo + zHi) / 2 : 0;

  const torsoLevels: Array<Support | null> = [];
  const legLevels: Array<Support | null> = [];
  const legCentres: Array<{ x: number; z: number } | null> = [];
  for (let level = 0; level < count; level += 1) {
    const torso = around(level, () => true);
    const t = supportOf(
      torso.map((i) => positions[i * 3]!),
      torso.map((i) => positions[i * 3 + 2]!),
      0,
      axisZ,
    );
    torsoLevels.push(t ? symmetric(t) : null);
    const leg = around(level, (i) => region[i] === REGION.LEG && positions[i * 3]! > 0);
    if (leg.length < 3) {
      legLevels.push(null);
      legCentres.push(null);
      continue;
    }
    const xs = leg.map((i) => positions[i * 3]!);
    const zs = leg.map((i) => positions[i * 3 + 2]!);
    const centre = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      z: (Math.min(...zs) + Math.max(...zs)) / 2,
    };
    legCentres.push(centre);
    legLevels.push(null); // filled below, once the centre line is smoothed
  }
  // Smooth the leg centre line so the trouser leg does not wobble with the knee and calf bumps.
  const known = legCentres.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
  let centres = legCentres.map((c, i) => c ?? legCentres[known.reduce((best, k) => (Math.abs(k - i) < Math.abs(best - i) ? k : best), known[0] ?? 0)] ?? { x: 0.09, z: axisZ });
  for (let pass = 0; pass < 12; pass += 1) {
    centres = centres.map((c, i) => {
      const a = centres[Math.max(0, i - 1)]!;
      const b = centres[Math.min(centres.length - 1, i + 1)]!;
      return { x: (a.x + 2 * c.x + b.x) / 4, z: (a.z + 2 * c.z + b.z) / 4 };
    });
  }
  for (let level = 0; level < count; level += 1) {
    if (!legCentres[level]) continue;
    const leg = around(level, (i) => region[i] === REGION.LEG && positions[i * 3]! > 0);
    legLevels[level] = supportOf(
      leg.map((i) => positions[i * 3]!),
      leg.map((i) => positions[i * 3 + 2]!),
      centres[level]!.x,
      centres[level]!.z,
    );
  }

  const torso = levelSampler(minY, LEVEL, torsoLevels);
  const leg = levelSampler(minY, LEVEL, legLevels);
  const legCentre = (y: number): { x: number; z: number } => {
    const f = clamp((y - minY) / LEVEL, 0, count - 1);
    const i = Math.min(count - 2, Math.floor(f));
    const t = f - i;
    const a = centres[i]!;
    const b = centres[i + 1] ?? a;
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  };

  // Shoulder ridge: per 1 cm of |x|, the highest point of the torso/arm skin above the armpit.
  const RIDGE = 0.01;
  const ridgeY: number[] = [];
  const ridgeZ: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = region[i];
    const y = positions[i * 3 + 1]!;
    if ((r !== REGION.TORSO && r !== REGION.ARM) || y < armpitY) continue;
    const b = Math.round(Math.abs(positions[i * 3]!) / RIDGE);
    if (b > 40) continue;
    if (ridgeY[b] === undefined || y > ridgeY[b]) {
      ridgeY[b] = y;
      ridgeZ[b] = positions[i * 3 + 2]!;
    }
  }
  const shoulder = (x: number): { y: number; z: number } | null => {
    const f = Math.abs(x) / RIDGE;
    const i = Math.floor(f);
    const a = ridgeY[i];
    const b = ridgeY[i + 1];
    if (a === undefined || b === undefined) return a === undefined ? null : { y: a, z: ridgeZ[i]! };
    const t = f - i;
    return { y: a + (b - a) * t, z: ridgeZ[i]! + (ridgeZ[i + 1]! - ridgeZ[i]!) * t };
  };

  // Skin top above the armpit, per 1 cm cell of (x, z) (the cell and its 8 neighbours: conservative).
  const TOP = 0.01;
  const tops = new Map<number, number>();
  const cell = (ix: number, iz: number): number => (ix + 500) * 1000 + (iz + 500);
  for (let i = 0; i < n; i += 1) {
    const r = region[i];
    const y = positions[i * 3 + 1]!;
    if ((r !== REGION.TORSO && r !== REGION.ARM) || y < armpitY) continue;
    const k = cell(Math.round(positions[i * 3]! / TOP), Math.round(positions[i * 3 + 2]! / TOP));
    if (y > (tops.get(k) ?? -Infinity)) tops.set(k, y);
  }
  const top = (x: number, z: number): number | null => {
    const ix = Math.round(x / TOP);
    const iz = Math.round(z / TOP);
    let best = -Infinity;
    for (let dx = -1; dx <= 1; dx += 1) for (let dz = -1; dz <= 1; dz += 1) best = Math.max(best, tops.get(cell(ix + dx, iz + dz)) ?? -Infinity);
    return Number.isFinite(best) ? best : null;
  };

  return { axisZ, crotchY, armpitY, torso, leg, legCentre, shoulder, top, arm: joint ? buildArm(positions, region, joint) : null };
};

const ARM_LEVEL = 0.015;

const buildArm = (positions: Float32Array, region: Uint8Array, joint: Vec3): LimbFrame | null => {
  const idx: number[] = [];
  for (let i = 0; i < region.length; i += 1) if (region[i] === REGION.ARM && positions[i * 3]! > 0) idx.push(i);
  if (idx.length < 20) return null;
  // Principal axis of the arm points (power iteration on the covariance).
  let mx = 0;
  let my = 0;
  let mz = 0;
  for (const i of idx) {
    mx += positions[i * 3]!;
    my += positions[i * 3 + 1]!;
    mz += positions[i * 3 + 2]!;
  }
  mx /= idx.length;
  my /= idx.length;
  mz /= idx.length;
  const c = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const i of idx) {
    const d = [positions[i * 3]! - mx, positions[i * 3 + 1]! - my, positions[i * 3 + 2]! - mz];
    for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) c[r * 3 + q]! += d[r]! * d[q]!;
  }
  let v = [0.5, -0.8, 0];
  for (let it = 0; it < 40; it += 1) {
    const w = [0, 1, 2].map((r) => c[r * 3]! * v[0]! + c[r * 3 + 1]! * v[1]! + c[r * 3 + 2]! * v[2]!);
    const len = Math.hypot(w[0]!, w[1]!, w[2]!) || 1;
    v = w.map((x) => x / len);
  }
  // From the joint towards the hand (down and out).
  if (v[1]! > 0) v = v.map((x) => -x);
  const dir = { x: v[0]!, y: v[1]!, z: v[2]! };
  const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
  const fz = { x: -dir.z * dir.x, y: -dir.z * dir.y, z: 1 - dir.z * dir.z };
  const fl = Math.hypot(fz.x, fz.y, fz.z) || 1;
  const front = { x: fz.x / fl, y: fz.y / fl, z: fz.z / fl };
  // side = dir × front, flipped if needed so it points away from the body (+x for the left arm).
  let side = { x: dir.y * front.z - dir.z * front.y, y: dir.z * front.x - dir.x * front.z, z: dir.x * front.y - dir.y * front.x };
  if (side.x < 0) side = { x: -side.x, y: -side.y, z: -side.z };

  let length = 0;
  const local = idx.map((i) => {
    const p = { x: positions[i * 3]! - joint.x, y: positions[i * 3 + 1]! - joint.y, z: positions[i * 3 + 2]! - joint.z };
    const t = dot(p, dir);
    length = Math.max(length, t);
    return { t, s: dot(p, side), f: dot(p, front) };
  });
  const count = Math.max(2, Math.ceil(length / ARM_LEVEL) + 1);
  const levels: Array<Support | null> = [];
  for (let level = 0; level < count; level += 1) {
    const t = level * ARM_LEVEL;
    const near = local.filter((p) => Math.abs(p.t - t) < WINDOW && p.t > -0.01);
    levels.push(supportOf(near.map((p) => p.s), near.map((p) => p.f), 0, 0));
  }
  const sampler = levelSampler(0, ARM_LEVEL, levels);
  // Wrist: the narrowest section between 55 % and 90 % of the reach. Past it, a sleeve rests on the
  // wrist section, not on the spread fingers (else a long sleeve flared into a bell over the hand).
  let wrist = length * 0.75;
  let narrowest = Infinity;
  for (let t = length * 0.55; t <= length * 0.9; t += ARM_LEVEL / 2) {
    const p = supportPerimeter(sampler(t));
    if (p < narrowest) {
      narrowest = p;
      wrist = t;
    }
  }
  const support = (t: number): Support => sampler(Math.min(t, wrist));
  const deltoid = local.filter((p) => p.t > -0.1 && p.t < 0.03);
  const cap = supportOf(deltoid.map((p) => p.s), deltoid.map((p) => p.f), 0, 0) ?? undefined;
  return { start: joint, dir, front, side, length, wrist, support, ...(cap ? { cap } : {}) };
};

/** Shoulder joint of the left (+x) arm: where the arm weight crosses one half, around the shoulder line. */
export const findJoint = (positions: Float32Array, armWeights: Float32Array, shoulderY: number, s: number): Vec3 | null => {
  let x = 0;
  let y = 0;
  let z = 0;
  let count = 0;
  for (let i = 0; i < armWeights.length; i += 1) {
    const py = positions[i * 3 + 1]!;
    if (positions[i * 3]! <= 0 || armWeights[i]! < 0.35 || armWeights[i]! > 0.65) continue;
    if (py < shoulderY - 0.12 * s || py > shoulderY + 0.05 * s) continue;
    x += positions[i * 3]!;
    y += py;
    z += positions[i * 3 + 2]!;
    count += 1;
  }
  return count > 0 ? { x: x / count, y: y / count, z: z / count } : null;
};

/** Armpit height of a body of these measurements (≈ 77 % of the stature). */
export const armpitHeight = (body: BodyMeasurements): number => bodyLandmarks(body).bustY + 0.07 * bodyScale(body);

/** Sample spacing on the skin (m): the low-poly legs have 4 cm triangles, a slice must never miss one. */
const SAMPLE = 0.01;

/** Envelope of the fitted human mesh (see human-body.ts), sampled densely over its triangles. */
export const envelopeFromMesh = (
  positions: Float32Array,
  indices: Uint32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
): BodyEnvelope => {
  const l = bodyLandmarks(body);
  const s = bodyScale(body);
  const headCut = l.napeY + 0.06 * s;
  // Above the nape only the neck column and the shoulders are under the fabric: the chin, the jaw and
  // the back of the skull stand out of the neck and are left out (else a neckline would wrap the chin).
  let zLo = Infinity;
  let zHi = -Infinity;
  for (let i = 0; i < armWeights.length; i += 1) {
    const y = positions[i * 3 + 1]!;
    if (armWeights[i]! >= 0.5 || Math.abs(y - l.napeY) > 0.01 || Math.abs(positions[i * 3]!) > 0.03) continue;
    zLo = Math.min(zLo, positions[i * 3 + 2]!);
    zHi = Math.max(zHi, positions[i * 3 + 2]!);
  }
  const neckZ = Number.isFinite(zLo) ? (zLo + zHi) / 2 : 0;
  const neckR = body.neck / (2 * Math.PI);
  const joint = findJoint(positions, armWeights, l.shoulderY, s);
  const armpitY = armpitHeight(body);
  const regionAt = (aw: number, x: number, y: number, z: number): number => {
    // Above the armpit, the skin between the neck and the shoulder joint (the front and back of the
    // shoulder, weighted to the arm) is under the bodice, not the sleeve.
    if (aw >= 0.5) return joint && y > armpitY - 0.03 * s && Math.abs(x) < joint.x + 0.02 * s ? REGION.TORSO : REGION.ARM;
    if (y > headCut) return REGION.NONE;
    if (y > l.napeY && Math.abs(x) < 1.5 * neckR && Math.hypot(x, z - neckZ) > 1.3 * neckR) return REGION.NONE;
    return y < l.crotchY ? REGION.LEG : REGION.TORSO;
  };
  const points: number[] = [];
  const region: number[] = [];
  for (let i = 0; i < armWeights.length; i += 1) {
    points.push(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!);
    region.push(regionAt(armWeights[i]!, positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!));
  }
  // Inside each triangle: a barycentric grid fine enough that no cross-section misses the skin.
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!;
    const b = indices[t + 1]!;
    const c = indices[t + 2]!;
    const edge = (i: number, j: number): number =>
      Math.hypot(positions[i * 3]! - positions[j * 3]!, positions[i * 3 + 1]! - positions[j * 3 + 1]!, positions[i * 3 + 2]! - positions[j * 3 + 2]!);
    const steps = Math.ceil(Math.max(edge(a, b), edge(b, c), edge(c, a)) / SAMPLE);
    if (steps <= 1) continue;
    for (let u = 0; u <= steps; u += 1) {
      for (let v = 0; v <= steps - u; v += 1) {
        const w = steps - u - v;
        if (u === steps || v === steps || w === steps) continue; // the corners are already there
        const ka = u / steps;
        const kb = v / steps;
        const kc = w / steps;
        const x = ka * positions[a * 3]! + kb * positions[b * 3]! + kc * positions[c * 3]!;
        const y = ka * positions[a * 3 + 1]! + kb * positions[b * 3 + 1]! + kc * positions[c * 3 + 1]!;
        const z = ka * positions[a * 3 + 2]! + kb * positions[b * 3 + 2]! + kc * positions[c * 3 + 2]!;
        points.push(x, y, z);
        region.push(regionAt(ka * armWeights[a]! + kb * armWeights[b]! + kc * armWeights[c]!, x, y, z));
      }
    }
  }
  return buildEnvelope({
    positions: Float32Array.from(points),
    region: Uint8Array.from(region),
    joint,
    crotchY: l.crotchY,
    armpitY,
  });
};

/**
 * Envelope of the procedural mannequin (torso rings, conical legs, straight arms): used before the
 * human mesh is loaded, when it cannot be, and in the unit tests.
 */
export const envelopeFromRings = (
  body: BodyMeasurements,
  rings: BodyRing[],
  legRadius: (y: number) => number,
  sleeve: { start: Vec3; dir: Vec3 },
): BodyEnvelope => {
  const l = bodyLandmarks(body);
  const s = bodyScale(body);
  const points: number[] = [];
  const region: number[] = [];
  const torso = loftRings(rings, 48);
  for (let i = 0; i < torso.positions.length; i += 3) {
    points.push(torso.positions[i]!, torso.positions[i + 1]!, torso.positions[i + 2]!);
    region.push(REGION.TORSO);
  }
  const legX = Math.max(0.088 * s, legRadius(l.crotchY) * 0.95);
  for (let y = l.ankleY; y < l.crotchY; y += 0.01) {
    const r = legRadius(y);
    for (let k = 0; k < 24; k += 1) {
      const a = (2 * Math.PI * k) / 24;
      for (const side of [1, -1]) {
        points.push(side * legX + r * Math.sin(a), y, r * Math.cos(a));
        region.push(REGION.LEG);
      }
    }
  }
  const upper = body.upperArm / (2 * Math.PI);
  const wrist = body.wrist / (2 * Math.PI);
  for (let t = 0; t <= body.armLength; t += 0.01) {
    const r = upper + ((wrist - upper) * t) / body.armLength;
    const c = { x: sleeve.start.x + sleeve.dir.x * t, y: sleeve.start.y + sleeve.dir.y * t };
    for (let k = 0; k < 16; k += 1) {
      const a = (2 * Math.PI * k) / 16;
      // Cross-section ⟂ to an axis in the xy plane: (−dir.y, dir.x) and z.
      points.push(c.x + r * Math.sin(a) * -sleeve.dir.y, c.y + r * Math.sin(a) * sleeve.dir.x, r * Math.cos(a));
      region.push(REGION.ARM);
    }
  }
  return buildEnvelope({
    positions: Float32Array.from(points),
    region: Uint8Array.from(region),
    joint: sleeve.start,
    crotchY: l.crotchY,
    armpitY: armpitHeight(body),
  });
};

/* ------------------------------------------------------------------------------------------------ */
/* Fabric rings: what a pattern row of a given circumference looks like around a support.           */

/** Perimeter of the convex shape with support h (Cauchy: ∮ h dθ). */
export const supportPerimeter = (h: Support): number => {
  let sum = 0;
  for (let k = 0; k < ANGLES; k += 1) sum += h[k]!;
  return (sum * 2 * Math.PI) / ANGLES;
};

/** Pointwise max of supports = support of the convex hull of the union (the fabric spans them all). */
export const supportMax = (list: Support[]): Support => {
  const out = new Float32Array(ANGLES).fill(-Infinity);
  for (const h of list) for (let k = 0; k < ANGLES; k += 1) if (h[k]! > out[k]!) out[k] = h[k]!;
  return out;
};

/**
 * The fabric ring: never inside the body (`body` + `gap`), and otherwise hanging from `hang` (the body
 * above it, where gravity lets the fabric fall from) offset by `delta`.
 */
export const ringFromDelta = (body: Support, hang: Support, gap: number, delta: number): Support => {
  const out = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) out[k] = Math.max(body[k]! + gap, hang[k]! + delta);
  return out;
};

/**
 * Finds the offset that gives the ring the pattern's circumference. Returns the ring and the offset;
 * a pattern narrower than the body (negative ease) is shown hugging the body (the fit report says so).
 */
export const ringForCircumference = (
  body: Support,
  hang: Support,
  gap: number,
  circumference: number,
): { ring: Support; delta: number } => {
  let lo = -0.6;
  let hi = 0.6 + circumference / (2 * Math.PI);
  if (supportPerimeter(ringFromDelta(body, hang, gap, lo)) >= circumference) return { ring: ringFromDelta(body, hang, gap, lo), delta: lo };
  for (let it = 0; it < 40; it += 1) {
    const mid = (lo + hi) / 2;
    if (supportPerimeter(ringFromDelta(body, hang, gap, mid)) < circumference) lo = mid;
    else hi = mid;
  }
  return { ring: ringFromDelta(body, hang, gap, hi), delta: hi };
};

export interface RingCurve {
  /** Points (local 2D: x = sin-axis, z = cos-axis) for k = 0..ANGLES-1, then the first again. */
  xs: Float32Array;
  zs: Float32Array;
  /** Cumulative arc length from θ = 0 (index k), closing at ANGLES with the perimeter. */
  arc: Float32Array;
}

/**
 * Pushes a point (relative to the support's centre) radially out of the convex shape `h` plus `gap`:
 * the ray from the centre through the point leaves the shape at the smallest (h_k + gap) / (p · u_k).
 * Points already outside are returned unchanged.
 */
export const pushOutside = (h: Support, gap: number, x: number, z: number): { x: number; z: number } => {
  let exit = Infinity;
  for (let k = 0; k < ANGLES; k += 1) {
    const d = x * SIN[k]! + z * COS[k]!;
    if (d > 1e-6) exit = Math.min(exit, (h[k]! + gap) / d);
  }
  return exit > 1 && Number.isFinite(exit) ? { x: x * exit, z: z * exit } : { x, z };
};

/** Boundary points of a support function: p(θ) = h u + h' u'. */
export const ringCurve = (support: Support): RingCurve => {
  // A light circular smoothing keeps the reconstruction free of tiny loops (it stays a valid support).
  const h = new Float32Array(ANGLES);
  for (let k = 0; k < ANGLES; k += 1) {
    h[k] = (support[(k + ANGLES - 1) % ANGLES]! + 2 * support[k]! + support[(k + 1) % ANGLES]!) / 4;
  }
  const step = (2 * Math.PI) / ANGLES;
  const xs = new Float32Array(ANGLES + 1);
  const zs = new Float32Array(ANGLES + 1);
  for (let k = 0; k < ANGLES; k += 1) {
    const d = (h[(k + 1) % ANGLES]! - h[(k + ANGLES - 1) % ANGLES]!) / (2 * step);
    xs[k] = h[k]! * SIN[k]! + d * COS[k]!;
    zs[k] = h[k]! * COS[k]! - d * SIN[k]!;
  }
  xs[ANGLES] = xs[0]!;
  zs[ANGLES] = zs[0]!;
  const arc = new Float32Array(ANGLES + 1);
  for (let k = 1; k <= ANGLES; k += 1) arc[k] = arc[k - 1]! + Math.hypot(xs[k]! - xs[k - 1]!, zs[k]! - zs[k - 1]!);
  return { xs, zs, arc };
};

/** Point at arc length `s` from θ = 0 (wrapping around). */
export const pointAt = (curve: RingCurve, s: number): { x: number; z: number } => {
  const total = curve.arc[ANGLES]!;
  let v = total > 0 ? s % total : 0;
  if (v < 0) v += total;
  let lo = 0;
  let hi = ANGLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (curve.arc[mid]! <= v) lo = mid;
    else hi = mid;
  }
  const span = curve.arc[lo + 1]! - curve.arc[lo]!;
  const t = span > 0 ? (v - curve.arc[lo]!) / span : 0;
  return { x: curve.xs[lo]! + (curve.xs[lo + 1]! - curve.xs[lo]!) * t, z: curve.zs[lo]! + (curve.zs[lo + 1]! - curve.zs[lo]!) * t };
};
