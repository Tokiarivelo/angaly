import { ApiProperty } from '@nestjs/swagger';
import {
  CreationAvailability,
  CreationCategoryDto as SharedCreationCategoryDto,
  CreationCollectionDto as SharedCreationCollectionDto,
  CreationDto,
  CreationMediaDto as SharedCreationMediaDto,
  PaginatedResponse,
} from '@angaly/types';

export class CreationMediaDto implements SharedCreationMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class CreationCategoryDto implements SharedCreationCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class CreationCollectionDto implements SharedCreationCollectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class CreationResponseDto implements CreationDto {
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
