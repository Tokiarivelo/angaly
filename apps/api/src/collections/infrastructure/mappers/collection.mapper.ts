import {
  CollectionDetailResponseDto,
  CollectionResponseDto,
} from '../../application/dtos/collection-response.dto';
import type { CollectionProps } from '../../domain/entities/collection.entity';
import { CollectionEntity } from '../../domain/entities/collection.entity';
import type {
  CollectionDetailRecord,
  CollectionSummaryRecord,
} from '../repositories/prisma-collection.repository';

type CommonRecordFields = Pick<
  CollectionSummaryRecord,
  'id' | 'slug' | 'name' | 'description' | 'story' | 'seasonYear' | 'publishedAt' | 'media' | 'createdAt' | 'updatedAt' | '_count'
>;

function mapCommon(record: CommonRecordFields): Omit<CollectionProps, 'creations'> {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    story: record.story,
    seasonYear: record.seasonYear,
    publishedAt: record.publishedAt,
    media: record.media.map((media) => ({ ...media, altText: media.altText ?? '' })),
    creationsCount: record._count.creations,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class CollectionMapper {
  static toDomainSummary(record: CollectionSummaryRecord): CollectionEntity {
    return CollectionEntity.create({ ...mapCommon(record), creations: null });
  }

  static toDomainDetail(record: CollectionDetailRecord): CollectionEntity {
    return CollectionEntity.create({
      ...mapCommon(record),
      creations: record.creations.map((creation) => ({
        id: creation.id,
        slug: creation.slug,
        name: creation.name,
        coverImageUrl: creation.media[0]?.url ?? null,
      })),
    });
  }

  static toResponseDto(entity: CollectionEntity): CollectionResponseDto {
    const dto = new CollectionResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.story = entity.story;
    dto.seasonYear = entity.seasonYear;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.media = entity.media;
    dto.creationsCount = entity.creationsCount;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  static toDetailResponseDto(entity: CollectionEntity): CollectionDetailResponseDto {
    const dto = new CollectionDetailResponseDto();
    Object.assign(dto, this.toResponseDto(entity));
    dto.creations = entity.creations ?? [];
    return dto;
  }
}
