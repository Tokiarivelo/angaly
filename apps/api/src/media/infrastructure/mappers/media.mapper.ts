import type { Media as PrismaMedia } from '@angaly/database';
import type { MediaEntityType as SharedMediaEntityType } from '@angaly/types';

import { MediaResponseDto } from '../../application/dtos/media-response.dto';
import { MediaEntity } from '../../domain/entities/media.entity';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';

export class MediaMapper {
  static toDomain(record: PrismaMedia): MediaEntity {
    return MediaEntity.create({
      id: record.id,
      bucket: record.bucket,
      objectKey: record.objectKey,
      url: record.url,
      altText: record.altText ?? '',
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      width: record.width,
      height: record.height,
      entityRef: MediaEntityRef.create(record.entityType, record.entityId),
      sortOrder: record.sortOrder,
      uploadedById: record.uploadedById,
      createdAt: record.createdAt,
    });
  }

  static toResponseDto(entity: MediaEntity): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = entity.id;
    dto.url = entity.url;
    dto.altText = entity.altText;
    dto.mimeType = entity.mimeType;
    dto.sizeBytes = entity.sizeBytes;
    dto.width = entity.width;
    dto.height = entity.height;
    dto.entityType = entity.entityRef.entityType as SharedMediaEntityType;
    dto.entityId = entity.entityRef.entityId;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
