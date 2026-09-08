import type { CategoryKind as SharedCategoryKind } from '@angaly/types';

import { CategoryResponseDto } from '../../application/dtos/category-response.dto';
import { CategoryEntity } from '../../domain/entities/category.entity';
import type { CategoryRecord } from '../repositories/prisma-category.repository';

export class CategoryMapper {
  static toDomain(record: CategoryRecord): CategoryEntity {
    return CategoryEntity.create({
      id: record.id,
      slug: record.slug,
      name: record.name,
      kind: record.kind,
    });
  }

  static toResponseDto(entity: CategoryEntity): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.name = entity.name;
    dto.kind = entity.kind as SharedCategoryKind;
    return dto;
  }
}
