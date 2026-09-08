import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto, CategoryKind } from '@angaly/types';

export class CategoryResponseDto implements CategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: CategoryKind })
  kind!: CategoryKind;
}
