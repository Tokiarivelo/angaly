import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { ClothSimJobDto, ClothSimUploadTargetDto } from '@angaly/types';

import { ClothSimJobDoneDto, ClothSimJobFailedDto } from '../../application/dtos/realistic-render.dto';
import { ClaimClothSimJobUseCase } from '../../application/use-cases/claim-cloth-sim-job.use-case';
import { CompleteClothSimJobUseCase } from '../../application/use-cases/complete-cloth-sim-job.use-case';
import { CreateClothSimUploadTargetUseCase } from '../../application/use-cases/create-cloth-sim-upload-target.use-case';
import { FailClothSimJobUseCase } from '../../application/use-cases/fail-cloth-sim-job.use-case';
import { ClothSimWorkerGuard } from '../guards/cloth-sim-worker.guard';

/**
 * Internal endpoints of the cloth-sim worker (apps/cloth-sim/cloth_sim/worker.py). Not for the web: hidden from
 * Swagger, guarded by the worker's shared token; to be kept off the public reverse proxy (docs/deployment.md).
 */
@ApiExcludeController()
@UseGuards(ClothSimWorkerGuard)
@Controller('internal/cloth-sim/jobs')
export class ClothSimJobsController {
  constructor(
    private readonly claimJob: ClaimClothSimJobUseCase,
    private readonly createUploadTarget: CreateClothSimUploadTargetUseCase,
    private readonly completeJob: CompleteClothSimJobUseCase,
    private readonly failJob: FailClothSimJobUseCase,
  ) {}

  @Post('claim')
  @HttpCode(200)
  async claim(): Promise<{ job: ClothSimJobDto | null }> {
    return { job: await this.claimJob.execute() };
  }

  @Post(':renderId/upload-target')
  @HttpCode(200)
  uploadTarget(@Param('renderId', ParseUUIDPipe) renderId: string): Promise<ClothSimUploadTargetDto> {
    return this.createUploadTarget.execute(renderId);
  }

  @Post(':renderId/done')
  @HttpCode(200)
  async done(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @Body() dto: ClothSimJobDoneDto,
  ): Promise<{ ok: true }> {
    await this.completeJob.execute(renderId, dto);
    return { ok: true };
  }

  @Post(':renderId/failed')
  @HttpCode(200)
  async failed(
    @Param('renderId', ParseUUIDPipe) renderId: string,
    @Body() dto: ClothSimJobFailedDto,
  ): Promise<{ ok: true }> {
    await this.failJob.execute(renderId, dto);
    return { ok: true };
  }
}
