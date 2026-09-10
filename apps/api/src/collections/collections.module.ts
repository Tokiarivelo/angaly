import { Module } from '@nestjs/common';

import { GetCollectionBySlugUseCase } from './application/use-cases/get-collection-by-slug.use-case';
import { ListCollectionsUseCase } from './application/use-cases/list-collections.use-case';
import { COLLECTION_REPOSITORY } from './domain/repositories/collection.repository';
import { PrismaCollectionRepository } from './infrastructure/repositories/prisma-collection.repository';
import { CollectionsController } from './presentation/controllers/collections.controller';

@Module({
  controllers: [CollectionsController],
  providers: [
    ListCollectionsUseCase,
    GetCollectionBySlugUseCase,
    { provide: COLLECTION_REPOSITORY, useClass: PrismaCollectionRepository },
  ],
  exports: [COLLECTION_REPOSITORY],
})
export class CollectionsModule {}
