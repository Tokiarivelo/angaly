import { findJoint } from './body-envelope';
import { bodyLandmarks, bodyScale, type BodyMeasurements } from './body-model';

/**
 * Movable joints of the human mesh, in degrees. An arm: `raise` lifts it sideways (abduction),
 * `forward` lifts it in front (flexion), `twist` turns it inwards about its own axis (internal
 * rotation: with a bent elbow, the hand comes towards the midline), `bend` folds the elbow. A leg:
 * `raise` opens it sideways, `forward` lifts the thigh, `bend` folds the knee backwards; `twist` is unused.
 * `left` is the body's own left (+x — on the right of the screen in the front view).
 */
export interface LimbPose {
  raise: number;
  forward: number;
  twist: number;
  bend: number;
}

export interface BodyPose {
  leftArm: LimbPose;
  rightArm: LimbPose;
  leftLeg: LimbPose;
  rightLeg: LimbPose;
}

export type LimbName = keyof BodyPose;
export type JointName = keyof LimbPose;

const REST: LimbPose = { raise: 0, forward: 0, twist: 0, bend: 0 };

export const NEUTRAL_POSE: BodyPose = { leftArm: REST, rightArm: REST, leftLeg: REST, rightLeg: REST };

/** Range of each joint (degrees) — anatomical, so the mesh never folds through itself. */
export const JOINT_LIMITS: Record<'arm' | 'leg', Record<JointName, [number, number]>> = {
  arm: { raise: [-30, 90], forward: [-30, 110], twist: [-30, 60], bend: [0, 150] },
  leg: { raise: [-10, 35], forward: [-20, 70], twist: [0, 0], bend: [0, 110] },
};

export type PosePresetId = 'NEUTRE' | 'PRESENTATION' | 'MIROIR';

/**
 * Ready-made poses. PRESENTATION: a model standing for a fashion plate — arms relaxed close to the body, elbows a
 * little bent, so the sleeves hang as on the photographs. MIROIR: the inspiration photo — a mirror selfie, phone held
 * at the face.
 */
export const POSE_PRESETS: Record<PosePresetId, { label: string; pose: BodyPose }> = {
  NEUTRE: { label: 'Debout, bras le long du corps', pose: NEUTRAL_POSE },
  PRESENTATION: {
    label: 'Présentation (bras relâchés, comme une planche de mode)',
    pose: {
      leftArm: { raise: -20, forward: 0, twist: 0, bend: 6 },
      rightArm: { raise: -20, forward: 0, twist: 0, bend: 6 },
      leftLeg: { raise: 0, forward: 0, twist: 0, bend: 0 },
      rightLeg: { raise: 0, forward: 0, twist: 0, bend: 0 },
    },
  },
  MIROIR: {
    label: 'Selfie au miroir (comme la photo)',
    pose: {
      leftArm: { raise: -15, forward: 80, twist: 40, bend: 120 },
      rightArm: { raise: -6, forward: -18, twist: -15, bend: 0 },
      leftLeg: { raise: 0, forward: 0, twist: 0, bend: 0 },
      rightLeg: { raise: 0, forward: 5, twist: 0, bend: 8 },
    },
  },
};

export const clampPose = (pose: BodyPose): BodyPose => {
  const limb = (p: LimbPose, kind: 'arm' | 'leg'): LimbPose => {
    const out = { ...p };
    for (const key of Object.keys(out) as JointName[]) {
      const [lo, hi] = JOINT_LIMITS[kind][key];
      out[key] = Math.min(hi, Math.max(lo, Number.isFinite(out[key]) ? out[key] : 0));
    }
    return out;
  };
  return {
    leftArm: limb(pose.leftArm, 'arm'),
    rightArm: limb(pose.rightArm, 'arm'),
    leftLeg: limb(pose.leftLeg, 'leg'),
    rightLeg: limb(pose.rightLeg, 'leg'),
  };
};

export const isNeutral = (pose: BodyPose): boolean =>
  (Object.values(pose) as LimbPose[]).every((p) => p.raise === 0 && p.forward === 0 && p.twist === 0 && p.bend === 0);

type V = [number, number, number];

const smooth = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

const norm = (v: V): V => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Rodrigues: p turned by `angle` (rad) about the unit `axis` through `centre`. */
const rotate = (p: V, centre: V, axis: V, angle: number): V => {
  if (angle === 0) return p;
  const v: V = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = cross(axis, v);
  const d = dot(axis, v) * (1 - c);
  return [
    centre[0] + v[0] * c + k[0] * s + axis[0] * d,
    centre[1] + v[1] * c + k[1] * s + axis[1] * d,
    centre[2] + v[2] * c + k[2] * s + axis[2] * d,
  ];
};

const RAD = Math.PI / 180;
/** Axes (for the body's left side; the right side is posed in mirror coordinates). */
const FLEXION: V = [-1, 0, 0]; // turns "down" towards the front
const ABDUCTION: V = [0, 0, 1]; // turns "down" towards +x (away from the body on the left)

/**
 * Poses the fitted body: each limb turns about its joints, every vertex by its own share of the limb
 * (arm weight near the shoulder, a smooth ramp over the elbow, the knee and the top of the thigh), so the
 * skin bends instead of breaking. The garment is then draped on the posed body. Pure numbers.
 */
export const applyPose = (
  positions: Float32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
  rawPose: BodyPose,
): Float32Array => {
  const pose = clampPose(rawPose);
  const out = Float32Array.from(positions);
  if (isNeutral(pose)) return out;
  const n = armWeights.length;
  const s = bodyScale(body);
  const l = bodyLandmarks(body);
  const joint = findJoint(positions, armWeights, l.shoulderY, s);

  // ---- Arms ----------------------------------------------------------------------------------------
  if (joint) {
    for (const [sign, limb] of [
      [1, pose.leftArm],
      [-1, pose.rightArm],
    ] as const) {
      if (limb.raise === 0 && limb.forward === 0 && limb.twist === 0 && limb.bend === 0) continue;
      const J: V = [joint.x, joint.y, joint.z];
      // The arm's axis at rest: from the joint to the centre of the firmly weighted arm (mirror coordinates).
      let cx = 0;
      let cy = 0;
      let cz = 0;
      let count = 0;
      for (let i = 0; i < n; i += 1) {
        if (armWeights[i]! < 0.9 || Math.sign(positions[i * 3]!) !== sign) continue;
        cx += sign * positions[i * 3]!;
        cy += positions[i * 3 + 1]!;
        cz += positions[i * 3 + 2]!;
        count += 1;
      }
      if (count === 0) continue;
      const dir = norm([cx / count - J[0], cy / count - J[1], cz / count - J[2]]);
      const upper = 0.186 * body.height; // shoulder → elbow
      const elbow: V = [J[0] + dir[0] * upper, J[1] + dir[1] * upper, J[2] + dir[2] * upper];
      const frontPerp = norm([-dir[2] * dir[0], -dir[2] * dir[1], 1 - dir[2] * dir[2]]);
      const elbowAxis = norm(cross(dir, frontPerp));
      for (let i = 0; i < n; i += 1) {
        const aw = armWeights[i]!;
        if (aw <= 0 || Math.sign(positions[i * 3]!) !== sign) continue;
        let p: V = [sign * out[i * 3]!, out[i * 3 + 1]!, out[i * 3 + 2]!];
        const t = (p[0] - J[0]) * dir[0] + (p[1] - J[1]) * dir[1] + (p[2] - J[2]) * dir[2];
        const fore = smooth((t - (upper - 0.035 * s)) / (0.07 * s)) * aw;
        p = rotate(p, elbow, elbowAxis, limb.bend * RAD * fore);
        const w = smooth(aw);
        p = rotate(p, J, dir, limb.twist * RAD * w);
        p = rotate(p, J, ABDUCTION, limb.raise * RAD * w);
        p = rotate(p, J, FLEXION, limb.forward * RAD * w);
        out[i * 3] = sign * p[0];
        out[i * 3 + 1] = p[1];
        out[i * 3 + 2] = p[2];
      }
    }
  }

  // ---- Legs ----------------------------------------------------------------------------------------
  const kneeY = body.kneeY ?? 0.285 * body.height;
  for (const [sign, limb] of [
    [1, pose.leftLeg],
    [-1, pose.rightLeg],
  ] as const) {
    if (limb.raise === 0 && limb.forward === 0 && limb.bend === 0) continue;
    const top = l.crotchY + 0.05 * s;
    const full = l.crotchY - 0.12 * s;
    // Centre of the leg (mirror coordinates) at the hip and at the knee.
    const centreAt = (y0: number): V | null => {
      let x = 0;
      let z = 0;
      let c = 0;
      for (let i = 0; i < n; i += 1) {
        if (armWeights[i]! >= 0.05 || Math.sign(positions[i * 3]!) !== sign) continue;
        if (Math.abs(positions[i * 3 + 1]! - y0) > 0.01) continue;
        x += sign * positions[i * 3]!;
        z += positions[i * 3 + 2]!;
        c += 1;
      }
      return c ? [x / c, y0, z / c] : null;
    };
    const knee = centreAt(kneeY);
    const hipCentre = centreAt(l.crotchY - 0.02 * s);
    if (!knee || !hipCentre) continue;
    const hip: V = [0.085 * s, l.crotchY + 0.08 * s, hipCentre[2]];
    for (let i = 0; i < n; i += 1) {
      if (armWeights[i]! >= 0.05 || Math.sign(positions[i * 3]!) !== sign) continue;
      const y0 = positions[i * 3 + 1]!;
      if (y0 > top) continue;
      let p: V = [sign * out[i * 3]!, out[i * 3 + 1]!, out[i * 3 + 2]!];
      const w = 1 - smooth((y0 - full) / (top - full));
      const shin = smooth((kneeY + 0.03 * s - y0) / (0.06 * s));
      // The shin folds backwards about the knee, then the whole leg turns about the hip.
      p = rotate(p, knee, [1, 0, 0], limb.bend * RAD * shin); // about +x: "down" turns towards the back
      p = rotate(p, hip, ABDUCTION, limb.raise * RAD * w);
      p = rotate(p, hip, FLEXION, limb.forward * RAD * w);
      out[i * 3] = sign * p[0];
      // A foot swung down onto the floor rests on it instead of going through.
      out[i * 3 + 1] = Math.max(p[1], 0);
      out[i * 3 + 2] = p[2];
    }
  }

  // Standing on the lowest foot.
  let lowest = Infinity;
  for (let i = 1; i < out.length; i += 3) lowest = Math.min(lowest, out[i]!);
  if (Number.isFinite(lowest) && lowest > 0.0) for (let i = 1; i < out.length; i += 3) out[i] = out[i]! - lowest;
  return out;
};

/**
 * Forearm and hand of each arm (1 per vertex), read on the body at rest: beyond the elbow along the
 * arm's axis. A posed body's envelope uses it so a folded forearm never passes for the upper arm.
 */
export const forearmMask = (rest: Float32Array, armWeights: Float32Array, body: BodyMeasurements): Uint8Array => {
  const n = armWeights.length;
  const mask = new Uint8Array(n);
  const s = bodyScale(body);
  const joint = findJoint(rest, armWeights, bodyLandmarks(body).shoulderY, s);
  if (!joint) return mask;
  for (const sign of [1, -1] as const) {
    let cx = 0;
    let cy = 0;
    let cz = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      if (armWeights[i]! < 0.9 || Math.sign(rest[i * 3]!) !== sign) continue;
      cx += sign * rest[i * 3]! - joint.x;
      cy += rest[i * 3 + 1]! - joint.y;
      cz += rest[i * 3 + 2]! - joint.z;
      count += 1;
    }
    if (count === 0) continue;
    const dir = norm([cx, cy, cz]);
    const elbow = 0.186 * body.height;
    for (let i = 0; i < n; i += 1) {
      if (armWeights[i]! < 0.5 || Math.sign(rest[i * 3]!) !== sign) continue;
      const t = (sign * rest[i * 3]! - joint.x) * dir[0] + (rest[i * 3 + 1]! - joint.y) * dir[1] + (rest[i * 3 + 2]! - joint.z) * dir[2];
      if (t > elbow - 0.01 * s) mask[i] = 1;
    }
  }
  return mask;
};

/** Centre of each hand on the posed body (the end of the arm beyond the wrist, measured at rest). */
export const handCentres = (
  rest: Float32Array,
  posed: Float32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
): Array<{ side: 1 | -1; x: number; y: number; z: number }> => {
  const n = armWeights.length;
  const s = bodyScale(body);
  const joint = findJoint(rest, armWeights, bodyLandmarks(body).shoulderY, s);
  if (!joint) return [];
  const out: Array<{ side: 1 | -1; x: number; y: number; z: number }> = [];
  for (const sign of [1, -1] as const) {
    let reach = 0;
    const ts = new Float32Array(n).fill(-1);
    let cx = 0;
    let cy = 0;
    let cz = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      if (armWeights[i]! < 0.9 || Math.sign(rest[i * 3]!) !== sign) continue;
      cx += sign * rest[i * 3]! - joint.x;
      cy += rest[i * 3 + 1]! - joint.y;
      cz += rest[i * 3 + 2]! - joint.z;
      count += 1;
    }
    if (count === 0) continue;
    const dir = norm([cx, cy, cz]);
    for (let i = 0; i < n; i += 1) {
      if (armWeights[i]! < 0.9 || Math.sign(rest[i * 3]!) !== sign) continue;
      const t = (sign * rest[i * 3]! - joint.x) * dir[0] + (rest[i * 3 + 1]! - joint.y) * dir[1] + (rest[i * 3 + 2]! - joint.z) * dir[2];
      ts[i] = t;
      reach = Math.max(reach, t);
    }
    // The hand: the last 10 cm of the arm.
    let x = 0;
    let y = 0;
    let z = 0;
    let k = 0;
    for (let i = 0; i < n; i += 1) {
      if (ts[i]! < reach - 0.1 * s) continue;
      x += posed[i * 3]!;
      y += posed[i * 3 + 1]!;
      z += posed[i * 3 + 2]!;
      k += 1;
    }
    if (k > 0) out.push({ side: sign, x: x / k, y: y / k, z: z / k });
  }
  return out;
};


/** Cloth may give this much (m) under a hand resting on it (see `restHandOnSkirt`). */
const HAND_SINK = 0.012;
/** Most an arm is moved out (degrees of abduction) to rest its hand on a wide skirt. */
const SEAT_RAISE_MAX = 60;

/** Vertices of each hand (the last 12 cm of the arm, wrist included), read on the body at rest. */
const handVertices = (rest: Float32Array, armWeights: Float32Array, body: BodyMeasurements): Map<1 | -1, number[]> => {
  const out = new Map<1 | -1, number[]>();
  const s = bodyScale(body);
  const joint = findJoint(rest, armWeights, bodyLandmarks(body).shoulderY, s);
  if (!joint) return out;
  for (const sign of [1, -1] as const) {
    const ids: number[] = [];
    const ts: number[] = [];
    let reach = 0;
    for (let i = 0; i < armWeights.length; i += 1) {
      if (armWeights[i]! < 0.9 || Math.sign(rest[i * 3]!) !== sign) continue;
      // Straight down the arm: the hand is the lowest part of an arm hanging at rest.
      const t = joint.y - rest[i * 3 + 1]!;
      ids.push(i);
      ts.push(t);
      reach = Math.max(reach, t);
    }
    out.set(sign, ids.filter((_, k) => ts[k]! >= reach - 0.12 * s));
  }
  return out;
};

/**
 * A wide skirt (a crinoline's dome) stands out further than the hands of arms hanging by the hips: the hands went
 * through the cloth. Each arm is moved out (abduction, a few degrees at a time) until its whole hand lies on the
 * skirt's outer surface (`surface`: radius about the body axis at a height and an angle, null where there is no
 * skirt) — the hands rest on the dress, as on a fashion plate. Other joints are kept; an arm already clear is left.
 */
export const seatHandsOnSkirt = (
  pose: BodyPose,
  rest: Float32Array,
  armWeights: Float32Array,
  body: BodyMeasurements,
  surface: (y: number, angle: number) => number | null,
  axisZ: number,
): BodyPose => {
  const hands = handVertices(rest, armWeights, body);
  let current = clampPose(pose);
  const inside = (posed: Float32Array, ids: number[]): number => {
    let depth = 0;
    for (const i of ids) {
      const x = posed[i * 3]!;
      const z = posed[i * 3 + 2]! - axisZ;
      const r = surface(posed[i * 3 + 1]!, Math.atan2(x, z));
      if (r !== null) depth = Math.max(depth, r - HAND_SINK - Math.hypot(x, z));
    }
    return depth;
  };
  for (let k = 0; k < 30; k += 1) {
    const posed = applyPose(rest, armWeights, body, current);
    let moved = false;
    for (const [sign, limb] of [
      [1, 'leftArm'],
      [-1, 'rightArm'],
    ] as const) {
      const depth = inside(posed, hands.get(sign) ?? []);
      const arm = current[limb];
      if (depth <= 0 || arm.raise >= SEAT_RAISE_MAX) continue;
      // About a centimetre out per degree at the hand (≈ 60 cm from the shoulder).
      const step = Math.min(8, Math.max(1, depth * 100));
      current = { ...current, [limb]: { ...arm, raise: Math.min(SEAT_RAISE_MAX, arm.raise + step) } };
      moved = true;
    }
    if (!moved) break;
  }
  return current;
};
