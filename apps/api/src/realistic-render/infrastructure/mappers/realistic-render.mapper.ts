import type { Prisma, RealisticRender } from '@angaly/database';
import type { RealisticRenderDto } from '@angaly/types';

import { RealisticRenderEntity } from '../../domain/entities/realistic-render.entity';
import {
  DEFAULT_REALISTIC_RENDER_POSE,
  isRealisticRenderPose,
} from '../../domain/value-objects/realistic-render-status.vo';

const asObject = (value: Prisma.JsonValue | null): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;

export class RealisticRenderMapper {
  static toEntity(record: RealisticRender): RealisticRenderEntity {
    return RealisticRenderEntity.create({
      id: record.id,
      versionId: record.versionId,
      requestedById: record.requestedById,
      pose: isRealisticRenderPose(record.pose) ? record.pose : DEFAULT_REALISTIC_RENDER_POSE,
      cacheKey: record.cacheKey,
      status: record.status,
      attempts: record.attempts,
      mediaId: record.mediaId,
      glbUrl: record.glbUrl,
      simPose: asObject(record.simPoseJson),
      metrics: asObject(record.metricsJson),
      error: record.error,
      durationMs: record.durationMs,
      cachedFromId: record.cachedFromId,
      createdAt: record.createdAt,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
    });
  }

  static toDto(entity: RealisticRenderEntity): RealisticRenderDto {
    return {
      id: entity.id,
      versionId: entity.versionId,
      pose: entity.pose,
      status: entity.status,
      glbUrl: entity.glbUrl,
      simPose: entity.simPose,
      error: entity.error,
      durationMs: entity.durationMs,
      cached: entity.cachedFromId !== null,
      createdAt: entity.createdAt.toISOString(),
      finishedAt: entity.finishedAt ? entity.finishedAt.toISOString() : null,
    };
  }
}
