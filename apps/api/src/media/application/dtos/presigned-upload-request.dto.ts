import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { MEDIA_ENTITY_TYPES, MediaEntityType } from '../../domain/value-objects/media-entity-ref.vo';

export class CreatePresignedUploadRequestDto {
  @ApiProperty({ enum: MEDIA_ENTITY_TYPES, example: 'CREATION' })
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType!: MediaEntityType;

  @ApiProperty({ example: 'robe-eternelle-01.jpg' })
  @IsString()
  @MinLength(1)
  originalFilename!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MinLength(1)
  mimeType!: string;

  @ApiProperty({ required: false, description: 'Prefix folder inside the bucket (e.g. a slug).' })
  @IsOptional()
  @IsString()
  keyPrefix?: string;
}

export class PresignedUploadResponseDto {
  @ApiProperty()
  bucket!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  expiresInSeconds!: number;
}
