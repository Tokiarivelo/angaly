/**
 * Domain-local mirror of `RealisticRenderStatus` / `RealisticRenderPose` (`@angaly/types`, `schema.prisma`).
 * Duplicated on purpose: the Domain layer imports nothing (.cursor/rules/003-nestjs-clean-arch.mdc).
 */
export const REALISTIC_RENDER_STATUSES = ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] as const;
export type RealisticRenderStatus = (typeof REALISTIC_RENDER_STATUSES)[number];

/** Pose presets of the 3D viewer (`apps/web/.../garment3d/pose.ts`, `PosePresetId`). */
export const REALISTIC_RENDER_POSES = ['NEUTRE', 'PRESENTATION', 'MIROIR'] as const;
export type RealisticRenderPose = (typeof REALISTIC_RENDER_POSES)[number];

export const DEFAULT_REALISTIC_RENDER_POSE: RealisticRenderPose = 'PRESENTATION';

export function isRealisticRenderPose(value: string): value is RealisticRenderPose {
  return (REALISTIC_RENDER_POSES as readonly string[]).includes(value);
}
