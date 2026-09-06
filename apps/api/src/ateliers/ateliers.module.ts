import { Module } from '@nestjs/common';

import { GetAtelierBySlugUseCase } from './application/use-cases/get-atelier-by-slug.use-case';
import { ListAteliersUseCase } from './application/use-cases/list-ateliers.use-case';
import { ATELIER_REPOSITORY } from './domain/repositories/atelier.repository';
import { PrismaAtelierRepository } from './infrastructure/repositories/prisma-atelier.repository';
import { AteliersController } from './presentation/controllers/ateliers.controller';

@Module({
  controllers: [AteliersController],
  providers: [
    ListAteliersUseCase,
    GetAtelierBySlugUseCase,
    { provide: ATELIER_REPOSITORY, useClass: PrismaAtelierRepository },
  ],
})
export class AteliersModule {}
