import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RealisticRenderConfig } from './application/services/realistic-render.config';
import { ClaimClothSimJobUseCase } from './application/use-cases/claim-cloth-sim-job.use-case';
import { CompleteClothSimJobUseCase } from './application/use-cases/complete-cloth-sim-job.use-case';
import { CreateClothSimUploadTargetUseCase } from './application/use-cases/create-cloth-sim-upload-target.use-case';
import { FailClothSimJobUseCase } from './application/use-cases/fail-cloth-sim-job.use-case';
import { GetRealisticRenderUseCase } from './application/use-cases/get-realistic-render.use-case';
import { RequestRealisticRenderUseCase } from './application/use-cases/request-realistic-render.use-case';
import { REALISTIC_RENDER_REPOSITORY } from './domain/repositories/realistic-render.repository';
import { RENDER_SOURCE_READER } from './domain/repositories/render-source.reader';
import { RENDER_STORAGE_GATEWAY } from './domain/services/render-storage.gateway';
import { PrismaRealisticRenderRepository } from './infrastructure/repositories/prisma-realistic-render.repository';
import { PrismaRenderSourceReader } from './infrastructure/repositories/prisma-render-source.reader';
import { MediaRenderStorageGateway } from './infrastructure/services/media-render-storage.gateway';
import { ClothSimJobsController } from './presentation/controllers/cloth-sim-jobs.controller';
import { RealisticRenderController } from './presentation/controllers/realistic-render.controller';
import { ClothSimWorkerGuard } from './presentation/guards/cloth-sim-worker.guard';

/** Realistic render of a pattern version by the cloth-sim worker — docs/features/realistic-render-blender.md. */
@Module({
  imports: [PrismaModule, AuthModule, CustomersModule, MediaModule],
  controllers: [RealisticRenderController, ClothSimJobsController],
  providers: [
    RealisticRenderConfig,
    ClothSimWorkerGuard,
    { provide: REALISTIC_RENDER_REPOSITORY, useClass: PrismaRealisticRenderRepository },
    { provide: RENDER_SOURCE_READER, useClass: PrismaRenderSourceReader },
    { provide: RENDER_STORAGE_GATEWAY, useClass: MediaRenderStorageGateway },
    RequestRealisticRenderUseCase,
    GetRealisticRenderUseCase,
    ClaimClothSimJobUseCase,
    CreateClothSimUploadTargetUseCase,
    CompleteClothSimJobUseCase,
    FailClothSimJobUseCase,
  ],
})
export class RealisticRenderModule {}
