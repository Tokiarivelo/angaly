// ============================================================
// Realistic render (Blender cloth simulation) — web ↔ api ↔ cloth-sim worker
// docs/features/realistic-render-blender.md
// ============================================================

import type { PatternPieceDto } from './index';

export const REALISTIC_RENDER_STATUSES = ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] as const;
export type RealisticRenderStatus = (typeof REALISTIC_RENDER_STATUSES)[number];

/** Pose presets of the 3D viewer (`utils/garment3d/pose.ts` → `PosePresetId`). */
export const REALISTIC_RENDER_POSES = ['NEUTRE', 'PRESENTATION', 'MIROIR'] as const;
export type RealisticRenderPose = (typeof REALISTIC_RENDER_POSES)[number];

/** What the web polls (`GET /pattern-versions/:id/realistic-render/:renderId`). */
export interface RealisticRenderDto {
  id: string;
  versionId: string;
  pose: RealisticRenderPose;
  status: RealisticRenderStatus;
  /** Simulated garment (`.glb`, Draco), set once DONE. Geometry + UVs only: the viewer applies its own fabrics. */
  glbUrl: string | null;
  /**
   * Pose the cloth was simulated in: the arms are opened until the sleeves have room (`simPose` of the job). The viewer
   * must pose the mannequin with it, not with the requested pose.
   */
  simPose: Record<string, unknown> | null;
  error: string | null;
  durationMs: number | null;
  /** True when an earlier render with the same pieces, measurements, pose and fabric was returned. */
  cached: boolean;
  createdAt: string;
  finishedAt: string | null;
}

export interface RequestRealisticRenderInput {
  pose?: RealisticRenderPose;
}

/**
 * A job handed to the cloth-sim worker (`POST /internal/cloth-sim/jobs/claim`). Same shape as
 * `apps/cloth-sim/scripts/dump-version.sh`, read by `apps/cloth-sim/tools/export-job.ts`. No customer name or id: an
 * anonymous mannequin (measurements) and the pieces only.
 */
export interface ClothSimJobDto {
  renderId: string;
  versionId: string;
  pose: RealisticRenderPose;
  garmentType: string;
  measurements: Record<string, number> | null;
  fabricBehavior: string | null;
  fit: Record<string, unknown> | null;
  pieces: PatternPieceDto[];
  /** The worker kills Blender past this delay. */
  timeoutSeconds: number;
}

/** Fresh presigned PUT for the `.glb`, asked once the simulation is over (presigned URLs expire in minutes). */
export interface ClothSimUploadTargetDto {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface ClothSimJobDoneInput {
  objectKey: string;
  sizeBytes: number;
  durationMs: number;
  simPose?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
}

export interface ClothSimJobFailedInput {
  error: string;
  durationMs?: number;
}
