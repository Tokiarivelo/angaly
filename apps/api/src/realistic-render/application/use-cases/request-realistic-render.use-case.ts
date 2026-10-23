import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { RealisticRenderEntity } from '../../domain/entities/realistic-render.entity';
import {
  IRealisticRenderRepository,
  REALISTIC_RENDER_REPOSITORY,
} from '../../domain/repositories/realistic-render.repository';
import {
  IRenderSourceReader,
  RENDER_SOURCE_READER,
} from '../../domain/repositories/render-source.reader';
import type { RealisticRenderPose } from '../../domain/value-objects/realistic-render-status.vo';
import { loadOwnedSource } from '../services/load-owned-source';
import { RealisticRenderConfig } from '../services/realistic-render.config';
import { renderCacheKey } from '../services/render-cache-key';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * « Rendu réaliste » button: reuses a finished render of the same garment (cache), or the one already queued for this
 * version, or queues a new job for the cloth-sim worker (quota per user and per day).
 */
@Injectable()
export class RequestRealisticRenderUseCase {
  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
    @Inject(RENDER_SOURCE_READER)
    private readonly sources: IRenderSourceReader,
    private readonly config: RealisticRenderConfig,
  ) {}

  async execute(
    versionId: string,
    customerId: string,
    userId: string,
    pose: RealisticRenderPose,
    now: Date = new Date(),
  ): Promise<RealisticRenderEntity> {
    const source = await loadOwnedSource(this.sources, versionId, customerId);
    if (source.pieces.length === 0) {
      throw new BadRequestException('Cette version de patron n’a aucune pièce à simuler.');
    }

    const cacheKey = renderCacheKey(source, pose, this.config.simulatorRevision);

    const pending = await this.renders.findPendingByVersionAndKey(versionId, cacheKey);
    if (pending) return pending;

    const done = await this.renders.findLatestDoneByCacheKey(cacheKey);
    if (done) {
      if (done.versionId === versionId) return done;
      return this.renders.createCached({
        id: randomUUID(),
        versionId,
        requestedById: userId,
        pose,
        cacheKey,
        source: done,
      });
    }

    const used = await this.renders.countSimulatedSince(userId, new Date(now.getTime() - DAY_MS));
    if (used >= this.config.maxPerDay) {
      throw new HttpException(
        `Limite de ${this.config.maxPerDay} rendus réalistes par jour atteinte. Réessayez demain.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.renders.create({ id: randomUUID(), versionId, requestedById: userId, pose, cacheKey });
  }
}
