import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { CollectionSort } from '../../domain/repositories/collection.repository';

const SORT_OPTIONS: CollectionSort[] = [
  'seasonYear:asc',
  'seasonYear:desc',
  'publishedAt:asc',
  'publishedAt:desc',
];

export class ListCollectionsQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seasonYear?: number;

  @ApiProperty({ required: false, enum: SORT_OPTIONS, default: 'publishedAt:desc' })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: CollectionSort = 'publishedAt:desc';

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
