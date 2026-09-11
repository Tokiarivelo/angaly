import type { CreationAvailability as SharedCreationAvailability } from '@angaly/types';

import { CreationResponseDto } from '../../application/dtos/creation-response.dto';
import { CreationEntity } from '../../domain/entities/creation.entity';
import type { CreationRecord } from '../repositories/prisma-creation.repository';

export class CreationMapper {
  static toDomain(record: CreationRecord): CreationEntity {
    return CreationEntity.create({
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      genre: record.genre,
      type: record.type,
      color: record.color,
      style: record.style,
      materials: record.materials,
      techniques: record.techniques,
      availability: record.availability,
      reproducible: record.reproducible,
      isFeatured: record.isFeatured,
      featuredFrom: record.featuredFrom,
      featuredUntil: record.featuredUntil,
      category: record.category,
      collection: record.collection,
      media: record.media.map((media) => ({ ...media, altText: media.altText ?? '' })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: CreationEntity): CreationResponseDto {
    const dto = new CreationResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.genre = entity.genre;
    dto.type = entity.type;
    dto.color = entity.color;
    dto.style = entity.style;
    dto.materials = entity.materials;
    dto.techniques = entity.techniques;
    dto.availability = entity.availability as SharedCreationAvailability;
    dto.reproducible = entity.reproducible;
    dto.isFeatured = entity.isFeatured;
    dto.featuredFrom = entity.featuredFrom?.toISOString() ?? null;
    dto.featuredUntil = entity.featuredUntil?.toISOString() ?? null;
    dto.category = entity.category;
    dto.collection = entity.collection;
    dto.media = entity.media;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
