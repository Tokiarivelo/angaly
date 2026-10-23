import type {
  RealisticRenderPose,
  RealisticRenderStatus,
} from '../value-objects/realistic-render-status.vo';

export interface RealisticRenderProps {
  id: string;
  versionId: string;
  requestedById: string;
  pose: RealisticRenderPose;
  cacheKey: string;
  status: RealisticRenderStatus;
  attempts: number;
  mediaId: string | null;
  glbUrl: string | null;
  simPose: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  error: string | null;
  durationMs: number | null;
  cachedFromId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

/** One realistic render (Blender cloth simulation) of a pattern version — also the worker's job. */
export class RealisticRenderEntity {
  private constructor(private readonly props: RealisticRenderProps) {}

  static create(props: RealisticRenderProps): RealisticRenderEntity {
    return new RealisticRenderEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get versionId(): string {
    return this.props.versionId;
  }

  get requestedById(): string {
    return this.props.requestedById;
  }

  get pose(): RealisticRenderPose {
    return this.props.pose;
  }

  get cacheKey(): string {
    return this.props.cacheKey;
  }

  get status(): RealisticRenderStatus {
    return this.props.status;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get mediaId(): string | null {
    return this.props.mediaId;
  }

  get glbUrl(): string | null {
    return this.props.glbUrl;
  }

  get simPose(): Record<string, unknown> | null {
    return this.props.simPose;
  }

  get metrics(): Record<string, unknown> | null {
    return this.props.metrics;
  }

  get error(): string | null {
    return this.props.error;
  }

  get durationMs(): number | null {
    return this.props.durationMs;
  }

  get cachedFromId(): string | null {
    return this.props.cachedFromId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get finishedAt(): Date | null {
    return this.props.finishedAt;
  }

  /** Still waiting for, or inside, the worker. */
  get isPending(): boolean {
    return this.props.status === 'QUEUED' || this.props.status === 'RUNNING';
  }

  /**
   * The object key a worker may upload this render's `.glb` to: everything under its own folder, nothing else (the
   * worker reports the key back, the API checks it before attaching the file).
   */
  static objectKeyPrefix(renderId: string): string {
    return `realistic-renders/${renderId}`;
  }

  ownsObjectKey(objectKey: string): boolean {
    const prefix = `${RealisticRenderEntity.objectKeyPrefix(this.props.id)}/`;
    return objectKey.startsWith(prefix) && !objectKey.slice(prefix.length).includes('/')
      && !objectKey.includes('..');
  }
}
