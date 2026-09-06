import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { MEDIA_ENTITY_TYPES, MediaEntityType } from '../../domain/value-objects/media-entity-ref.vo';

/** Metadata fields for `POST /api/media/upload` (multipart) — the file itself comes via `@UploadedFile()`. */
export class UploadMediaBufferRequestDto {
  @ApiProperty({ enum: MEDIA_ENTITY_TYPES, example: 'CREATION' })
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType!: MediaEntityType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Mandatory for accessibility/SEO (spec §74/§71).' })
  @IsString()
  @MinLength(1)
  altText!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyPrefix?: string;
}
