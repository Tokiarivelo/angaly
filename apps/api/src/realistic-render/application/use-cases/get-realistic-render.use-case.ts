import { Inject, Injectable, NotFoundException } from '@nestjs/common';

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

/** Polled by the web every few seconds until the render is DONE or FAILED. */
@Injectable()
export class GetRealisticRenderUseCase {
  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
    @Inject(RENDER_SOURCE_READER)
    private readonly sources: IRenderSourceReader,
  ) {}

  async execute(versionId: string, renderId: string, customerId: string): Promise<RealisticRenderEntity> {
    await loadOwnedSource(this.sources, versionId, customerId);
    const render = await this.renders.findById(renderId);
    if (render?.versionId !== versionId) {
      throw new NotFoundException(`Rendu réaliste introuvable: ${renderId}`);
    }
    return render;
  }

  /** The latest render of a version (optionally in one pose), so the page can show it again on load. */
  async latest(
    versionId: string,
    customerId: string,
    pose?: RealisticRenderPose,
  ): Promise<RealisticRenderEntity | null> {
    await loadOwnedSource(this.sources, versionId, customerId);
    return this.renders.findLatestByVersion(versionId, pose);
  }
}
