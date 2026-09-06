import { SearchResultDto } from '../../application/dtos/search-results-response.dto';
import type { SearchResultType } from '../../domain/entities/search-result.entity';
import { SearchResultEntity } from '../../domain/entities/search-result.entity';

/** Raw shape shared by every per-entity `$queryRaw` query in prisma-search.repository.ts. */
export interface SearchRawRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
}

export class SearchResultMapper {
  static toDomain(row: SearchRawRow, type: SearchResultType): SearchResultEntity {
    return SearchResultEntity.create({
      type,
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      imageUrl: row.imageUrl,
    });
  }

  static toResponseDto(entity: SearchResultEntity): SearchResultDto {
    const dto = new SearchResultDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.title = entity.title;
    dto.excerpt = entity.excerpt;
    dto.imageUrl = entity.imageUrl;
    return dto;
  }
}
