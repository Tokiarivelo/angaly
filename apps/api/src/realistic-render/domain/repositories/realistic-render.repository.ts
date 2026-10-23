import type { RealisticRenderEntity } from '../entities/realistic-render.entity';
import type { RealisticRenderPose } from '../value-objects/realistic-render-status.vo';

export const REALISTIC_RENDER_REPOSITORY = Symbol('IRealisticRenderRepository');

export interface CreateRealisticRenderData {
  id: string;
  versionId: string;
  requestedById: string;
  pose: RealisticRenderPose;
  cacheKey: string;
}

/** A finished render copied from an earlier one with the same cache key (no simulation). */
export interface CreateCachedRealisticRenderData extends CreateRealisticRenderData {
  source: RealisticRenderEntity;
}

export interface MarkRenderDoneData {
  mediaId: string;
  glbUrl: string;
  durationMs: number;
  simPose: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
}

/**
 * The `realistic_renders` table is both the render history and the worker's job queue (no Redis in production:
 * docs/features/realistic-render-blender.md §3).
 */
export interface IRealisticRenderRepository {
  create(data: CreateRealisticRenderData): Promise<RealisticRenderEntity>;
  createCached(data: CreateCachedRealisticRenderData): Promise<RealisticRenderEntity>;
  findById(id: string): Promise<RealisticRenderEntity | null>;
  findLatestDoneByCacheKey(cacheKey: string): Promise<RealisticRenderEntity | null>;
  findPendingByVersionAndKey(versionId: string, cacheKey: string): Promise<RealisticRenderEntity | null>;
  findLatestByVersion(versionId: string, pose?: RealisticRenderPose): Promise<RealisticRenderEntity | null>;
  /** Renders a user asked for since `since` — copies from the cache cost nothing and are not counted. */
  countSimulatedSince(requestedById: string, since: Date): Promise<number>;
  /**
   * Renders RUNNING since before `staleBefore` (the worker died or was killed) that used every attempt → FAILED.
   * Returns how many.
   */
  failStale(staleBefore: Date, maxAttempts: number): Promise<number>;
  /**
   * Takes the oldest QUEUED render (or a stale RUNNING one with attempts left) → RUNNING, attempts + 1, atomically
   * (`FOR UPDATE SKIP LOCKED`: two workers never get the same job).
   */
  claimNext(staleBefore: Date, maxAttempts: number): Promise<RealisticRenderEntity | null>;
  /** RUNNING → DONE. False when the render is no longer RUNNING (another worker took it back). */
  markDone(id: string, data: MarkRenderDoneData): Promise<boolean>;
  /** RUNNING → FAILED. Same guard as markDone. */
  markFailed(id: string, error: string, durationMs: number | null): Promise<boolean>;
}
