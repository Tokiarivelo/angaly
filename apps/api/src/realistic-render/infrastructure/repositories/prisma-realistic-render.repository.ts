import { Injectable } from '@nestjs/common';
import { Prisma, type RealisticRender } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import type { RealisticRenderEntity } from '../../domain/entities/realistic-render.entity';
import type {
  CreateCachedRealisticRenderData,
  CreateRealisticRenderData,
  IRealisticRenderRepository,
  MarkRenderDoneData,
} from '../../domain/repositories/realistic-render.repository';
import type { RealisticRenderPose } from '../../domain/value-objects/realistic-render-status.vo';
import { RealisticRenderMapper } from '../mappers/realistic-render.mapper';

const toJson = (value: Record<string, unknown> | null): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);

@Injectable()
export class PrismaRealisticRenderRepository implements IRealisticRenderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRealisticRenderData): Promise<RealisticRenderEntity> {
    const record = await this.prisma.realisticRender.create({ data: { ...data, status: 'QUEUED' } });
    return RealisticRenderMapper.toEntity(record);
  }

  async createCached(data: CreateCachedRealisticRenderData): Promise<RealisticRenderEntity> {
    const { source, ...render } = data;
    const now = new Date();
    const record = await this.prisma.realisticRender.create({
      data: {
        ...render,
        status: 'DONE',
        mediaId: source.mediaId,
        glbUrl: source.glbUrl,
        simPoseJson: toJson(source.simPose),
        metricsJson: toJson(source.metrics),
        durationMs: 0,
        cachedFromId: source.cachedFromId ?? source.id,
        startedAt: now,
        finishedAt: now,
      },
    });
    return RealisticRenderMapper.toEntity(record);
  }

  async findById(id: string): Promise<RealisticRenderEntity | null> {
    const record = await this.prisma.realisticRender.findUnique({ where: { id } });
    return record ? RealisticRenderMapper.toEntity(record) : null;
  }

  async findLatestDoneByCacheKey(cacheKey: string): Promise<RealisticRenderEntity | null> {
    const record = await this.prisma.realisticRender.findFirst({
      where: { cacheKey, status: 'DONE', glbUrl: { not: null } },
      orderBy: { finishedAt: 'desc' },
    });
    return record ? RealisticRenderMapper.toEntity(record) : null;
  }

  async findPendingByVersionAndKey(
    versionId: string,
    cacheKey: string,
  ): Promise<RealisticRenderEntity | null> {
    const record = await this.prisma.realisticRender.findFirst({
      where: { versionId, cacheKey, status: { in: ['QUEUED', 'RUNNING'] } },
      orderBy: { createdAt: 'desc' },
    });
    return record ? RealisticRenderMapper.toEntity(record) : null;
  }

  async findLatestByVersion(
    versionId: string,
    pose?: RealisticRenderPose,
  ): Promise<RealisticRenderEntity | null> {
    const record = await this.prisma.realisticRender.findFirst({
      where: { versionId, ...(pose ? { pose } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return record ? RealisticRenderMapper.toEntity(record) : null;
  }

  countSimulatedSince(requestedById: string, since: Date): Promise<number> {
    return this.prisma.realisticRender.count({
      where: { requestedById, cachedFromId: null, createdAt: { gte: since } },
    });
  }

  async failStale(staleBefore: Date, maxAttempts: number): Promise<number> {
    const result = await this.prisma.realisticRender.updateMany({
      where: { status: 'RUNNING', startedAt: { lt: staleBefore }, attempts: { gte: maxAttempts } },
      data: {
        status: 'FAILED',
        error: 'Le worker de simulation ne répond plus (délai dépassé).',
        finishedAt: new Date(),
      },
    });
    return result.count;
  }

  async claimNext(staleBefore: Date, maxAttempts: number): Promise<RealisticRenderEntity | null> {
    // One statement: the sub-select locks the row it picks and skips rows other workers hold.
    const rows = await this.prisma.$queryRaw<RealisticRender[]>(Prisma.sql`
      UPDATE "realistic_renders"
      SET "status" = 'RUNNING', "startedAt" = NOW(), "attempts" = "attempts" + 1, "error" = NULL
      WHERE "id" = (
        SELECT "id" FROM "realistic_renders"
        WHERE "attempts" < ${maxAttempts}
          AND ("status" = 'QUEUED' OR ("status" = 'RUNNING' AND "startedAt" < ${staleBefore}))
        ORDER BY "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *`);
    const record = rows[0];
    return record ? RealisticRenderMapper.toEntity(record) : null;
  }

  async markDone(id: string, data: MarkRenderDoneData): Promise<boolean> {
    const result = await this.prisma.realisticRender.updateMany({
      where: { id, status: 'RUNNING' },
      data: {
        status: 'DONE',
        mediaId: data.mediaId,
        glbUrl: data.glbUrl,
        durationMs: data.durationMs,
        simPoseJson: toJson(data.simPose),
        metricsJson: toJson(data.metrics),
        error: null,
        finishedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  async markFailed(id: string, error: string, durationMs: number | null): Promise<boolean> {
    const result = await this.prisma.realisticRender.updateMany({
      where: { id, status: 'RUNNING' },
      data: { status: 'FAILED', error, durationMs, finishedAt: new Date() },
    });
    return result.count > 0;
  }
}
