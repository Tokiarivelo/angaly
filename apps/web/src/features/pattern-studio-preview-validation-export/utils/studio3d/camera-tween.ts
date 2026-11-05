/**
 * Smooth camera moves between preset views (« state to state »: one eased move of fixed length).
 * Pure: no three.js, so it is unit-tested without a renderer.
 */

export type Vec3 = readonly [number, number, number];

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

/** Length of a move between two views, ms. */
export const CAMERA_TWEEN_MS = 600;

/**
 * CSS-like cubic-bezier easing with (0,0) and (1,1) as end points. Solves x(s) = t by bisection (x is monotonic
 * for control x in [0, 1]), then returns y(s).
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number): ((t: number) => number) => {
  const curve = (s: number, p1: number, p2: number): number => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (curve(mid, x1, x2) < t) lo = mid;
      else hi = mid;
    }
    return curve((lo + hi) / 2, y1, y2);
  };
};

/** Ease-in-out used for every view change. */
export const easeCameraMove = cubicBezier(0.65, 0, 0.35, 1);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface Spherical {
  radius: number;
  /** Angle from +y, rad. */
  polar: number;
  /** Angle around y from +z towards +x, rad. */
  azimuth: number;
}

const toSpherical = ([x, y, z]: Vec3): Spherical => {
  const radius = Math.hypot(x, y, z);
  if (radius === 0) return { radius: 0, polar: Math.PI / 2, azimuth: 0 };
  return { radius, polar: Math.acos(Math.max(-1, Math.min(1, y / radius))), azimuth: Math.atan2(x, z) };
};

const fromSpherical = ({ radius, polar, azimuth }: Spherical): Vec3 => [
  radius * Math.sin(polar) * Math.sin(azimuth),
  radius * Math.cos(polar),
  radius * Math.sin(polar) * Math.cos(azimuth),
];

/** Shortest signed turn from a to b, in (-π, π]. */
const shortestTurn = (a: number, b: number): number => {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
};

/**
 * Pose at eased progress `t` (0 → from, 1 → to). The target moves in a straight line; the camera turns around it
 * on a sphere (radius, height angle and the shortest way round), so it never cuts through the mannequin.
 */
export const interpolatePose = (from: CameraPose, to: CameraPose, t: number): CameraPose => {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const target: Vec3 = [lerp(from.target[0], to.target[0], t), lerp(from.target[1], to.target[1], t), lerp(from.target[2], to.target[2], t)];
  const a = toSpherical([from.position[0] - from.target[0], from.position[1] - from.target[1], from.position[2] - from.target[2]]);
  const b = toSpherical([to.position[0] - to.target[0], to.position[1] - to.target[1], to.position[2] - to.target[2]]);
  const offset = fromSpherical({
    radius: lerp(a.radius, b.radius, t),
    polar: lerp(a.polar, b.polar, t),
    azimuth: a.azimuth + shortestTurn(a.azimuth, b.azimuth) * t,
  });
  return { position: [target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]], target };
};

/** Pose `elapsedMs` into a move, eased; `done` once the move is over. */
export const poseAt = (from: CameraPose, to: CameraPose, elapsedMs: number, durationMs = CAMERA_TWEEN_MS): { pose: CameraPose; done: boolean } => {
  const linear = durationMs <= 0 ? 1 : Math.max(0, Math.min(1, elapsedMs / durationMs));
  return { pose: interpolatePose(from, to, easeCameraMove(linear)), done: linear >= 1 };
};
