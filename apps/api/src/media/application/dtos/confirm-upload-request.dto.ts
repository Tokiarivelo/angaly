import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min, MinLength } from 'class-validator';
import { MAX_MEDIA_UPLOAD_SIZE_BYTES } from '@angaly/types';

import { MEDIA_ENTITY_TYPES, MediaEntityType } from '../../domain/value-objects/media-entity-ref.vo';

/**
 * `POST /api/media/confirm` — registers the Media row once the browser's
 * direct PUT to MinIO succeeds. No path param: unlike the doc table's
 * original `/:id/confirm` sketch, no Media resource exists before this call
 * (see docs/features/media.md "Points d'attention" for the note).
 */
export class ConfirmUploadRequestDto {
  @ApiProperty({ description: 'Returned by POST /api/media/presigned-upload' })
  @IsString()
  @MinLength(1)
  bucket!: string;

  @ApiProperty({ description: 'Returned by POST /api/media/presigned-upload' })
  @IsString()
  @MinLength(1)
  objectKey!: string;

  @ApiProperty({ enum: MEDIA_ENTITY_TYPES, example: 'CREATION' })
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType!: MediaEntityType;

  @ApiProperty({ required: false, description: 'Owning row id once known (may be set later via the owning module).' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Mandatory for accessibility/SEO (spec §74/§71).' })
  @IsString()
  @MinLength(1)
  altText!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MinLength(1)
  mimeType!: string;

  @ApiProperty({ example: 245_760, maximum: MAX_MEDIA_UPLOAD_SIZE_BYTES })
  @IsInt()
  @IsPositive()
  @Max(MAX_MEDIA_UPLOAD_SIZE_BYTES)
  sizeBytes!: number;

  @ApiProperty({ required: false, example: 1200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiProperty({ required: false, example: 1600 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}
