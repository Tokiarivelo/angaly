import { ConflictException, NotFoundException } from '@nestjs/common';

import type { RealisticRenderEntity } from '../../domain/entities/realistic-render.entity';
import type { IRealisticRenderRepository } from '../../domain/repositories/realistic-render.repository';

/** A worker may only report on a render it is running: a job given back to another worker is no longer its own. */
export async function loadRunningRender(
  renders: IRealisticRenderRepository,
  renderId: string,
): Promise<RealisticRenderEntity> {
  const render = await renders.findById(renderId);
  if (!render) {
    throw new NotFoundException(`Rendu réaliste introuvable: ${renderId}`);
  }
  if (render.status !== 'RUNNING') {
    throw new ConflictException(`Le rendu ${renderId} n’est plus en cours (${render.status}).`);
  }
  return render;
}
