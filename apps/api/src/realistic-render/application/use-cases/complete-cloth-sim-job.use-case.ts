import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import type { ClothSimJobDoneInput } from '@angaly/types';

import {
  IRealisticRenderRepository,
  REALISTIC_RENDER_REPOSITORY,
} from '../../domain/repositories/realistic-render.repository';
import {
  IRenderStorageGateway,
  RENDER_STORAGE_GATEWAY,
} from '../../domain/services/render-storage.gateway';
import { loadRunningRender } from '../services/load-running-render';

/** Worker side: the `.glb` is in MinIO → Media row, render DONE. */
@Injectable()
export class CompleteClothSimJobUseCase {
  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
    @Inject(RENDER_STORAGE_GATEWAY)
    private readonly storage: IRenderStorageGateway,
  ) {}

  async execute(renderId: string, input: ClothSimJobDoneInput): Promise<void> {
    const render = await loadRunningRender(this.renders, renderId);
    if (!render.ownsObjectKey(input.objectKey)) {
      throw new BadRequestException('Clé d’objet hors du dossier de ce rendu.');
    }

    const stored = await this.storage.confirmUpload({
      objectKey: input.objectKey,
      sizeBytes: input.sizeBytes,
      versionId: render.versionId,
      altText: `Rendu réaliste (simulation de tissu) — pose ${render.pose}`,
    });

    const updated = await this.renders.markDone(render.id, {
      mediaId: stored.mediaId,
      glbUrl: stored.url,
      durationMs: input.durationMs,
      simPose: input.simPose ?? null,
      metrics: input.metrics ?? null,
    });
    if (!updated) {
      throw new ConflictException(`Le rendu ${renderId} n’est plus en cours.`);
    }
  }
}
