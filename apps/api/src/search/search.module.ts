import { Module } from '@nestjs/common';

import { GlobalSearchUseCase } from './application/use-cases/global-search.use-case';
import { SEARCH_REPOSITORY } from './domain/repositories/search.repository';
import { PrismaSearchRepository } from './infrastructure/repositories/prisma-search.repository';
import { SearchController } from './presentation/controllers/search.controller';

@Module({
  controllers: [SearchController],
  providers: [GlobalSearchUseCase, { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository }],
})
export class SearchModule {}
