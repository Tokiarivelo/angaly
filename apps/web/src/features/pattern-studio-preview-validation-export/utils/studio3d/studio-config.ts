/**
 * Settings of the 3D "studio" (light, shadows, ambient occlusion, anti-aliasing), as plain data: no three.js here,
 * so the choices can be tested without WebGL. Ported from the teardown project's V8 stage
 * (`~/Documents/Projects/teardown/sims/v8-shared/stage.js`, `live.js`).
 */

export type Vec3 = readonly [number, number, number];

export type QualityTierName = 'high' | 'medium' | 'low';

export interface QualityTier {
  name: QualityTierName;
  /** MSAA samples of the post-processing render target (0 ⇒ no anti-aliasing). */
  samples: number;
  /** Screen-space ambient occlusion (GTAO). */
  ao: boolean;
  /** Side of the key light's shadow map, in texels. */
  shadowMap: number;
  /** Highest device pixel ratio the canvas renders at. */
  maxDpr: number;
}

export const QUALITY_TIERS: Record<QualityTierName, QualityTier> = {
  high: { name: 'high', samples: 8, ao: true, shadowMap: 4096, maxDpr: 2 },
  medium: { name: 'medium', samples: 4, ao: false, shadowMap: 2048, maxDpr: 1.5 },
  low: { name: 'low', samples: 0, ao: false, shadowMap: 1024, maxDpr: 1 },
};

/** From the best to the cheapest. */
export const TIER_ORDER: readonly QualityTierName[] = ['high', 'medium', 'low'];

export interface DeviceHints {
  /** `matchMedia('(pointer: coarse)')`: a phone or a tablet. */
  coarsePointer: boolean;
  /** Smaller side of the window, in CSS px. */
  minSide: number;
  /** `navigator.deviceMemory` in GB, when the browser tells it. */
  deviceMemory?: number | undefined;
}

/** Phones, small windows and low-memory devices start in `low`, a modest machine in `medium`, the rest in `high`. */
export const pickInitialTier = ({ coarsePointer, minSide, deviceMemory }: DeviceHints): QualityTierName => {
  if (coarsePointer || minSide < 700 || (deviceMemory !== undefined && deviceMemory <= 2)) return 'low';
  if (deviceMemory !== undefined && deviceMemory <= 4) return 'medium';
  return 'high';
};

/** Average frame time (ms) above which the studio steps down one tier: under ~36 fps. */
export const SLOW_FRAME_MS = 28;
/** Frames averaged before deciding. */
export const SLOW_FRAME_WINDOW = 60;

/**
 * The tier to use after these frame times: one tier lower when the last `SLOW_FRAME_WINDOW` frames average more than
 * `SLOW_FRAME_MS`, the same tier otherwise (or when too few frames were measured, or already at `low`).
 */
export const nextTierOnSlowFrames = (tier: QualityTierName, frameTimesMs: readonly number[]): QualityTierName => {
  if (frameTimesMs.length < SLOW_FRAME_WINDOW) return tier;
  const recent = frameTimesMs.slice(-SLOW_FRAME_WINDOW);
  const mean = recent.reduce((sum, t) => sum + t, 0) / recent.length;
  if (mean <= SLOW_FRAME_MS) return tier;
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, i + 1)]!;
};

export type LightingPresetName = 'studio' | 'soft' | 'contrast';

/** A bright panel of the environment map (a softbox): what glossy fabric and eyes reflect. */
export interface Softbox {
  width: number;
  height: number;
  position: Vec3;
  /** Brightness multiplier of the panel's white (> 1 ⇒ brighter than the paper around it). */
  intensity: number;
}

export interface StudioLight {
  position: Vec3;
  intensity: number;
  color: string;
}

export interface LightingPreset {
  name: LightingPresetName;
  label: string;
  /** The one light that casts a shadow. */
  key: StudioLight & {
    /** VSM blur radius, in texels of a `SHADOW_RADIUS_MAP_SIZE` map: larger ⇒ softer shadow edge. */
    shadowRadius: number;
  };
  /** Shadowless lights that open the shadows (fill, rim, kicker). */
  fills: readonly StudioLight[];
  hemisphere: { sky: string; ground: string; intensity: number };
  /** Softboxes of the environment map, around a mannequin standing at the origin (metres). */
  softboxes: readonly Softbox[];
  /** `scene.environmentIntensity`. */
  environmentIntensity: number;
  /** Darkness of the shadow caught by the invisible floor (0–1). */
  floorShadowOpacity: number;
}

/**
 * Studio light setups. Positions are in metres around a 1.70 m body standing at the origin, facing +z.
 * `studio`: the V8's — a large top softbox, two side strips and a warm kicker; `soft`: the top softbox alone, a wide
 * shadow (flat, even read of the cut); `contrast`: a low raking side light that brings out velvet pile and smocking.
 */
export const LIGHTING_PRESETS: Record<LightingPresetName, LightingPreset> = {
  studio: {
    name: 'studio',
    label: 'Studio',
    key: { position: [-2.2, 3.6, 2.4], intensity: 2.4, color: '#FFF6EA', shadowRadius: 10 },
    fills: [
      { position: [3, 1.6, 2.8], intensity: 0.45, color: '#C9D4E6' },
      { position: [0.6, 3.2, -3.4], intensity: 1.6, color: '#F0E6D2' },
      { position: [2.6, 0.6, 1.2], intensity: 0.2, color: '#E8C9A0' },
    ],
    hemisphere: { sky: '#FFFFFF', ground: '#3A3B3F', intensity: 0.6 },
    softboxes: [
      { width: 6, height: 6, position: [0, 7, 1], intensity: 2.6 },
      { width: 1.5, height: 7, position: [-6, 2, 3], intensity: 3.4 },
      { width: 1.5, height: 7, position: [6, 2, -2], intensity: 2.2 },
      { width: 9, height: 1, position: [0, 1, 7], intensity: 1.6 },
    ],
    environmentIntensity: 0.5,
    floorShadowOpacity: 0.32,
  },
  soft: {
    name: 'soft',
    label: 'Doux',
    key: { position: [-0.6, 4.4, 2], intensity: 1.9, color: '#FFF8F0', shadowRadius: 16 },
    fills: [
      { position: [2.4, 2, 2.6], intensity: 0.55, color: '#E6E9F0' },
      { position: [0, 3, -3.4], intensity: 0.7, color: '#F0E6D2' },
    ],
    hemisphere: { sky: '#FFFFFF', ground: '#45464A', intensity: 0.5 },
    softboxes: [{ width: 8, height: 8, position: [0, 7, 1.5], intensity: 2.8 }],
    environmentIntensity: 0.45,
    floorShadowOpacity: 0.24,
  },
  contrast: {
    name: 'contrast',
    label: 'Contraste',
    key: { position: [-3.6, 1.9, 1], intensity: 2.8, color: '#FFF1DE', shadowRadius: 5 },
    fills: [
      { position: [3, 1.2, 2.4], intensity: 0.18, color: '#A9BAD6' },
      { position: [1.2, 3.4, -3.2], intensity: 1.1, color: '#F0E6D2' },
    ],
    hemisphere: { sky: '#FFFFFF', ground: '#26272A', intensity: 0.2 },
    softboxes: [
      { width: 1.5, height: 6, position: [-6, 1.6, 2], intensity: 3.6 },
      { width: 4, height: 4, position: [0, 7, -1], intensity: 1.4 },
    ],
    environmentIntensity: 0.3,
    floorShadowOpacity: 0.4,
  },
};

/** Behind the mannequin: the photo-studio grey paper (real fabric) or the atelier's navy (technical colours). */
export type StudioBackdropName = 'paper' | 'navy';

/** Base colour of the environment map's room, around the softboxes. */
export const ENVIRONMENT_ROOM_COLORS: Record<StudioBackdropName, string> = {
  paper: '#8E8F93',
  navy: '#2A3A55',
};

/** Where the key light aims: the middle of a standing body (its shadow camera is centred there). */
export const SHADOW_TARGET: Vec3 = [0, 0.85, 0];

/** Map size the presets' shadow radii are given for (scaled for the tier's actual map). */
export const SHADOW_RADIUS_MAP_SIZE = 2048;

/** Shadow camera half-size (m) around the body: tight ⇒ sharp shadow map texels. */
export const SHADOW_CAMERA_HALF_SIZE = 1.2;

/** GTAO settings (teardown's, the radius scaled for a body rather than an engine). */
export const AO_SETTINGS = {
  radius: 0.05,
  distanceExponent: 1.4,
  thickness: 0.6,
  scale: 1,
  samples: 16,
  distanceFallOff: 1,
  blendIntensity: 0.75,
} as const;

/**
 * AO strength over Blender's simulated cloth: its folds are real geometry (the preview's drape is smoother), so the
 * occlusion in their hollows can be stronger without greying the flat parts.
 */
export const SIMULATED_CLOTH_AO_BLEND = 0.9;

/** The device pixel ratio range of the canvas for a tier, from the device's own ratio. */
export const dprRange = (tier: QualityTierName, devicePixelRatio: number): [number, number] => {
  const max = Math.min(QUALITY_TIERS[tier].maxDpr, Math.max(1, devicePixelRatio));
  return [Math.min(1, max), max];
};

/** A gap longer than this between two frames is an idle pause (on-demand rendering), not a slow frame. */
export const IDLE_GAP_MS = 200;

/**
 * Adds a frame time to the measured ones: gaps (the canvas was idle) are dropped and only the last
 * `SLOW_FRAME_WINDOW` times are kept.
 */
export const pushFrameTime = (times: readonly number[], dtMs: number): number[] => {
  if (!Number.isFinite(dtMs) || dtMs <= 0 || dtMs > IDLE_GAP_MS) return [...times];
  const next = [...times, dtMs];
  return next.length > SLOW_FRAME_WINDOW ? next.slice(next.length - SLOW_FRAME_WINDOW) : next;
};
