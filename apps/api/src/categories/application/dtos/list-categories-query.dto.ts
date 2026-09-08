import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CategoryKind } from '@angaly/types';

export class ListCategoriesQueryDto {
  @ApiProperty({ required: false, enum: CategoryKind })
  @IsOptional()
  @IsEnum(CategoryKind)
  kind?: CategoryKind;
}
