/** Preset camera views of the 3D preview. Pure. */
import type { CameraPose, Vec3 } from './camera-tween';

export type ViewName = 'front' | 'back' | 'side' | 'top' | 'reset' | 'face' | 'threeQuarter' | 'hem';

export const VIEW_DISTANCE = 3.3;
export const VIEW_TARGET: Vec3 = [0, 0.88, 0];
/** Close-up on the face (head height of a 1.70 m body), looking at the eyes. */
const FACE_TARGET: Vec3 = [0, 1.58, 0.02];
const FACE_POSITION: Vec3 = [0.12, 1.6, 0.85];
/** 3/4 view: 35° round from the front, a little above the waist. */
const THREE_QUARTER_ANGLE = (35 * Math.PI) / 180;
const THREE_QUARTER_RISE = 0.4;
/** Hem close-up: offset of the camera from the hem point (a little to the side and above). */
const HEM_OFFSET: Vec3 = [0.35, 0.18, 1.3];

/** The lowest height reached by the garment's main panels (front/back of bodice, skirt, torso, legs), m. */
export const hemHeight = (
  panels: ReadonlyArray<{ role: string; zone: string; positions: ArrayLike<number> }>,
  fallback: number,
): number => {
  let lowest = Infinity;
  for (const panel of panels) {
    if (panel.role !== 'front' && panel.role !== 'back') continue;
    if (!['bodice', 'skirt', 'torso', 'legs'].includes(panel.zone)) continue;
    for (let i = 1; i < panel.positions.length; i += 3) lowest = Math.min(lowest, panel.positions[i]!);
  }
  return Number.isFinite(lowest) ? lowest : fallback;
};

/**
 * Where the camera goes for a view. `stature` scales the face close-up (a child's head is lower); `hemY` is the
 * hem height for the « Ourlet » close-up.
 */
export const viewPose = (view: ViewName, { stature, hemY }: { stature: number; hemY: number }): CameraPose => {
  const [, ty] = VIEW_TARGET;
  switch (view) {
    case 'face': {
      const k = stature / 1.7;
      return {
        position: [FACE_POSITION[0], FACE_POSITION[1] * k, FACE_POSITION[2] * Math.sqrt(k)],
        target: [FACE_TARGET[0], FACE_TARGET[1] * k, FACE_TARGET[2]],
      };
    }
    case 'hem': {
      const y = Math.max(0.05, hemY);
      return { position: [HEM_OFFSET[0], y + HEM_OFFSET[1], HEM_OFFSET[2]], target: [0, y, 0] };
    }
    case 'threeQuarter':
      return {
        position: [Math.sin(THREE_QUARTER_ANGLE) * VIEW_DISTANCE, ty + THREE_QUARTER_RISE, Math.cos(THREE_QUARTER_ANGLE) * VIEW_DISTANCE],
        target: VIEW_TARGET,
      };
    case 'back':
      return { position: [0, ty, -VIEW_DISTANCE], target: VIEW_TARGET };
    case 'side':
      return { position: [VIEW_DISTANCE, ty, 0], target: VIEW_TARGET };
    case 'top':
      return { position: [0, ty + VIEW_DISTANCE, 0.001], target: VIEW_TARGET };
    case 'reset':
      return { position: [0, 1.0, VIEW_DISTANCE], target: VIEW_TARGET };
    case 'front':
    default:
      return { position: [0, ty, VIEW_DISTANCE], target: VIEW_TARGET };
  }
};
