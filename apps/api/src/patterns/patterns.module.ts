import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { PatternEngineModule } from '../pattern-engine/pattern-engine.module';
import { MediaModule } from '../media/media.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { AiInferenceModule } from '../ai-inference/ai-inference.module';

import { PATTERN_PROJECT_REPOSITORY } from './domain/repositories/pattern-project.repository';
import { PATTERN_VERSION_REPOSITORY } from './domain/repositories/pattern-version.repository';

import { PrismaPatternProjectRepository } from './infrastructure/repositories/prisma-pattern-project.repository';
import { PrismaPatternVersionRepository } from './infrastructure/repositories/prisma-pattern-version.repository';

import { CreatePatternProjectUseCase } from './application/use-cases/create-pattern-project.use-case';
import { GetPatternProjectUseCase } from './application/use-cases/get-pattern-project.use-case';
import { ListPatternProjectsUseCase } from './application/use-cases/list-pattern-projects.use-case';
import { UpdatePatternProjectStepUseCase } from './application/use-cases/update-pattern-project-step.use-case';
import { GeneratePatternVersionUseCase } from './application/use-cases/generate-pattern-version.use-case';
import { RequestReviewUseCase } from './application/use-cases/request-review.use-case';
import { ExportPatternVersionUseCase } from './application/use-cases/export-pattern-version.use-case';
import { ListPatternVersionsUseCase } from './application/use-cases/list-pattern-versions.use-case';
import { RestorePatternVersionUseCase } from './application/use-cases/restore-pattern-version.use-case';

import { PatternProjectsController } from './presentation/controllers/pattern-projects.controller';
import { PatternVersionsController } from './presentation/controllers/pattern-versions.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CustomersModule,
    PatternEngineModule,
    MediaModule,
    MeasurementsModule,
    AiInferenceModule,
  ],
  controllers: [PatternProjectsController, PatternVersionsController],
  providers: [
    {
      provide: PATTERN_PROJECT_REPOSITORY,
      useClass: PrismaPatternProjectRepository,
    },
    {
      provide: PATTERN_VERSION_REPOSITORY,
      useClass: PrismaPatternVersionRepository,
    },
    CreatePatternProjectUseCase,
    GetPatternProjectUseCase,
    ListPatternProjectsUseCase,
    UpdatePatternProjectStepUseCase,
    GeneratePatternVersionUseCase,
    RequestReviewUseCase,
    ExportPatternVersionUseCase,
    ListPatternVersionsUseCase,
    RestorePatternVersionUseCase,
  ],
  exports: [
    PATTERN_PROJECT_REPOSITORY,
    PATTERN_VERSION_REPOSITORY,
    GetPatternProjectUseCase,
    CreatePatternProjectUseCase,
  ],
})
export class PatternsModule {}
