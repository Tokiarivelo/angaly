import { Module } from '@nestjs/common';

import { GetCreationBySlugUseCase } from './application/use-cases/get-creation-by-slug.use-case';
import { ListCreationsUseCase } from './application/use-cases/list-creations.use-case';
import { CREATION_REPOSITORY } from './domain/repositories/creation.repository';
import { PrismaCreationRepository } from './infrastructure/repositories/prisma-creation.repository';
import { CreationsController } from './presentation/controllers/creations.controller';

@Module({
  controllers: [CreationsController],
  providers: [
    ListCreationsUseCase,
    GetCreationBySlugUseCase,
    { provide: CREATION_REPOSITORY, useClass: PrismaCreationRepository },
  ],
  exports: [CREATION_REPOSITORY],
})
export class CreationsModule {}
