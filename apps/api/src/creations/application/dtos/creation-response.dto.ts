import { ApiProperty } from '@nestjs/swagger';
import { CreationAvailability, PaginatedResponse } from '@angaly/types';

export class CreationMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class CreationCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class CreationCollectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class CreationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true })
  materials!: string | null;

  @ApiProperty({ nullable: true })
  techniques!: string | null;

  @ApiProperty({ enum: CreationAvailability })
  availability!: CreationAvailability;

  @ApiProperty()
  reproducible!: boolean;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ nullable: true })
  featuredFrom!: string | null;

  @ApiProperty({ nullable: true })
  featuredUntil!: string | null;

  @ApiProperty({ type: CreationCategoryDto })
  category!: CreationCategoryDto;

  @ApiProperty({ type: CreationCollectionDto, nullable: true })
  collection!: CreationCollectionDto | null;

  @ApiProperty({ type: [CreationMediaDto] })
  media!: CreationMediaDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedCreationResponseDto implements PaginatedResponse<CreationResponseDto> {
  @ApiProperty({ type: [CreationResponseDto] })
  data!: CreationResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<CreationResponseDto>['meta'];
}
