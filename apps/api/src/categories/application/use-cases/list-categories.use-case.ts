import { Inject, Injectable } from '@nestjs/common';

import { CategoryEntity } from '../../domain/entities/category.entity';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../../domain/repositories/category.repository';
import type { CategoryKind } from '../../domain/value-objects/category-kind.vo';

@Injectable()
export class ListCategoriesUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository) {}

  execute(kind?: CategoryKind): Promise<CategoryEntity[]> {
    return this.categoryRepository.list(kind);
  }
}
