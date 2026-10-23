import { Inject, Injectable } from '@nestjs/common';
import type { ClothSimJobFailedInput } from '@angaly/types';

import {
  IRealisticRenderRepository,
  REALISTIC_RENDER_REPOSITORY,
} from '../../domain/repositories/realistic-render.repository';
import { loadRunningRender } from '../services/load-running-render';

/** Kept short: the reason is shown to the customer and stored, not a full Blender log. */
const MAX_ERROR_LENGTH = 1000;

/** Worker side: Blender failed, timed out or the upload failed → FAILED with the reason. */
@Injectable()
export class FailClothSimJobUseCase {
  constructor(
    @Inject(REALISTIC_RENDER_REPOSITORY)
    private readonly renders: IRealisticRenderRepository,
  ) {}

  async execute(renderId: string, input: ClothSimJobFailedInput): Promise<void> {
    const render = await loadRunningRender(this.renders, renderId);
    await this.renders.markFailed(
      render.id,
      input.error.slice(0, MAX_ERROR_LENGTH),
      input.durationMs ?? null,
    );
  }
}
