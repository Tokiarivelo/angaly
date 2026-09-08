import { Module } from '@nestjs/common';

import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { CategoriesController } from './presentation/controllers/categories.controller';

@Module({
  controllers: [CategoriesController],
  providers: [ListCategoriesUseCase, { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository }],
})
export class CategoriesModule {}
