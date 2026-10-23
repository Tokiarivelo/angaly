import { Injectable } from '@nestjs/common';

const positiveInt = (raw: string | undefined, fallback: number): number => {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

/**
 * Settings of the realistic render (docs/features/realistic-render-blender.md §7, docs/environment-variables.md).
 * Read on every call so tests and a restarted worker see the current environment.
 */
@Injectable()
export class RealisticRenderConfig {
  /** Simulated renders per user and per rolling 24 h (copies from the cache are free). */
  get maxPerDay(): number {
    return positiveInt(process.env.CLOTH_SIM_MAX_PER_DAY, 10);
  }

  /** Blender is killed past this delay; a RUNNING job older than that plus a margin is considered dead. */
  get timeoutSeconds(): number {
    return positiveInt(process.env.CLOTH_SIM_TIMEOUT_S, 600);
  }

  /** Attempts per job (a worker that died mid-simulation gives the job back once). */
  get maxAttempts(): number {
    return positiveInt(process.env.CLOTH_SIM_MAX_ATTEMPTS, 2);
  }

  /** Bump when the simulation changes enough that old renders must not be reused (part of the cache key). */
  get simulatorRevision(): string {
    const revision = process.env.CLOTH_SIM_REVISION?.trim();
    return revision === undefined || revision === '' ? '1' : revision;
  }

  /** Shared secret of the cloth-sim worker (`Authorization: Bearer …` on /internal/cloth-sim). Empty = endpoints off. */
  get workerToken(): string {
    return process.env.CLOTH_SIM_WORKER_TOKEN?.trim() ?? '';
  }

  /** A RUNNING job whose worker has been silent this long is given back (timeout + 2 min for upload and export). */
  staleBefore(now: Date): Date {
    return new Date(now.getTime() - (this.timeoutSeconds + 120) * 1000);
  }
}
