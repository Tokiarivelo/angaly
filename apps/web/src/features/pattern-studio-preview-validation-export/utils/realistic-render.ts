import type { RealisticRenderDto, RealisticRenderPose, RealisticRenderStatus } from '@angaly/types';
import { NEUTRAL_POSE, POSE_PRESETS, type BodyPose, type JointName, type LimbName } from './garment3d/pose';

/** The viewer's pose presets the simulation knows (`PosePresetId` without a custom pose). */
export const toRenderPose = (presetId: string): RealisticRenderPose =>
  presetId === 'NEUTRE' || presetId === 'MIROIR' ? presetId : 'PRESENTATION';

export const isRenderPending = (status: RealisticRenderStatus | undefined): boolean =>
  status === 'QUEUED' || status === 'RUNNING';

export const RENDER_STATUS_LABELS: Record<RealisticRenderStatus, string> = {
  QUEUED: 'En file d’attente',
  RUNNING: 'Simulation du tissu en cours',
  DONE: 'Rendu réaliste prêt',
  FAILED: 'Le rendu a échoué',
};

/** Which fabric dresses a material of the simulated `.glb` (named `<zone>-<role or piece>[-side][:accent]`). */
export type RenderClothRole = 'dress' | 'plastron' | 'accent';

export const clothRoleForMaterial = (name: string): RenderClothRole => {
  if (name.endsWith(':accent')) return 'accent';
  const [zone = '', role = ''] = name.split('-');
  return zone === 'plastron' || role === 'plastron' ? 'plastron' : 'dress';
};

/** A detail of the simulated garment drawn as a motif (embroidery, smocking), and its thread colour. */
export interface RenderMotif {
  motif: 'BRODERIE' | 'SMOCKS';
  color?: string;
}

/** The motifs of the preview's panels, by panel id (the `.glb` names each material after its panel). */
export const panelMotifs = (panels: ReadonlyArray<{ id: string; motif?: RenderMotif['motif'] | undefined; trimColor?: string | undefined }>): Map<string, RenderMotif> => {
  const out = new Map<string, RenderMotif>();
  for (const p of panels) if (p.motif) out.set(p.id, { motif: p.motif, ...(p.trimColor ? { color: p.trimColor } : {}) });
  return out;
};

/** The motif of a `.glb` material (its panel id, maybe with an accent suffix or Blender's `.001`), or null. */
export const motifForMaterial = (name: string, motifs: ReadonlyMap<string, RenderMotif>): RenderMotif | null =>
  motifs.get(name.replace(/\.\d{3}$/, '').replace(/:accent$/, '')) ?? null;

const LIMBS: LimbName[] = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const JOINTS: JointName[] = ['raise', 'forward', 'twist', 'bend'];

/**
 * The pose the cloth was simulated in (`simPose`): the arms are opened until the sleeves have room, so the mannequin
 * must take that pose, not the requested one. Anything malformed falls back on the requested preset.
 */
export const simulatedPose = (render: Pick<RealisticRenderDto, 'simPose' | 'pose'>): BodyPose => {
  const fallback = POSE_PRESETS[render.pose]?.pose ?? NEUTRAL_POSE;
  const raw = render.simPose;
  if (!raw) return fallback;
  const pose = { ...fallback };
  for (const limb of LIMBS) {
    const angles = raw[limb];
    if (!angles || typeof angles !== 'object') return fallback;
    const next = { ...fallback[limb] };
    for (const joint of JOINTS) {
      const value = (angles as Record<string, unknown>)[joint];
      if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
      next[joint] = value;
    }
    pose[limb] = next;
  }
  return pose;
};
