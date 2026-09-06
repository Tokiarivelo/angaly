import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { MEDIA_ENTITY_TYPES, MediaEntityType } from '../../domain/value-objects/media-entity-ref.vo';

export class ListMediaQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiProperty({ required: false, enum: MEDIA_ENTITY_TYPES })
  @IsOptional()
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType?: MediaEntityType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
