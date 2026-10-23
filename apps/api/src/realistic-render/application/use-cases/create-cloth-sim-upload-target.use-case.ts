import { Inject, Injectable } from '@nestjs/common';
import type { ClothSimUploadTargetDto } from '@angaly/types';

import { RealisticRenderEntity } from '../../domain/entities/realistic-render.entity';
import {
  IRealisticRenderRepository,
  REALISTIC_RENDER_REPOSITORY,
} from '../../domain/repositories/realistic-render.repository';
import {
  IRenderStorageGateway,
  RENDER_STORAGE_GATEWAY,
} from '../../domain/services/render-storage.gateway';
import { loadRunningRender } from '../services/load-running-render';

/**
 * Worker side: a fresh presigned PUT for the `.glb`, asked once Blender is done (a URL signed at claim time would have
 * expired during the simulation). The worker never holds MinIO credentials.
 */
@Injectable()
export class CreateClothSimUploadTargetUseCase {
  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
    @Inject(RENDER_STORAGE_GATEWAY)
    private readonly storage: IRenderStorageGateway,
  ) {}

  async execute(renderId: string): Promise<ClothSimUploadTargetDto> {
    const render = await loadRunningRender(this.renders, renderId);
    return this.storage.createUploadTarget(RealisticRenderEntity.objectKeyPrefix(render.id));
  }
}
