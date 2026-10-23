import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ClothSimJobDto, PatternPieceDto } from '@angaly/types';

import {
  IRealisticRenderRepository,
  REALISTIC_RENDER_REPOSITORY,
} from '../../domain/repositories/realistic-render.repository';
import {
  IRenderSourceReader,
  RENDER_SOURCE_READER,
} from '../../domain/repositories/render-source.reader';
import { RealisticRenderConfig } from '../services/realistic-render.config';

/**
 * Worker side: hands the oldest queued render to the cloth-sim worker, with what `tools/export-job.ts` reads (same
 * shape as `scripts/dump-version.sh`). Renders whose worker died past every attempt are failed first.
 */
@Injectable()
export class ClaimClothSimJobUseCase {
  private readonly logger = new Logger(ClaimClothSimJobUseCase.name);

  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
    @Inject(RENDER_SOURCE_READER)
    private readonly sources: IRenderSourceReader,
    private readonly config: RealisticRenderConfig,
  ) {}

  async execute(now: Date = new Date()): Promise<ClothSimJobDto | null> {
    const staleBefore = this.config.staleBefore(now);
    const failed = await this.renders.failStale(staleBefore, this.config.maxAttempts);
    if (failed > 0) this.logger.warn(`${failed} rendu(s) réaliste(s) abandonné(s) : worker silencieux.`);

    const render = await this.renders.claimNext(staleBefore, this.config.maxAttempts);
    if (!render) return null;

    const source = await this.sources.findByVersionId(render.versionId);
    if (!source) {
      await this.renders.markFailed(render.id, 'Version de patron introuvable.', null);
      return null;
    }

    return {
      renderId: render.id,
      versionId: render.versionId,
      pose: render.pose,
      garmentType: source.garmentType,
      measurements: source.measurements,
      fabricBehavior: source.fabricBehavior,
      fit: source.fit,
      pieces: source.pieces as PatternPieceDto[],
      timeoutSeconds: this.config.timeoutSeconds,
    };
  }
}
