import { ApiProperty } from '@nestjs/swagger';
import {
  CollectionCreationDto as SharedCollectionCreationDto,
  CollectionDetailDto,
  CollectionDto,
  CollectionMediaDto as SharedCollectionMediaDto,
  PaginatedResponse,
} from '@angaly/types';

export class CollectionMediaDto implements SharedCollectionMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  altText!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class CollectionCreationDto implements SharedCollectionCreationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  coverImageUrl!: string | null;
}

/** Shape returned by GET /api/collections — creationsCount only, never the full Creation[] (see docs/features/collections.md). */
export class CollectionResponseDto implements CollectionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  story!: string | null;

  @ApiProperty({ nullable: true })
  seasonYear!: number | null;

  @ApiProperty({ nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ type: [CollectionMediaDto] })
  media!: CollectionMediaDto[];

  @ApiProperty()
  creationsCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

/** Shape returned by GET /api/collections/:slug — adds the ordered Creation[]. */
export class CollectionDetailResponseDto extends CollectionResponseDto implements CollectionDetailDto {
  @ApiProperty({ type: [CollectionCreationDto] })
  creations!: CollectionCreationDto[];
}

export class PaginatedCollectionResponseDto implements PaginatedResponse<CollectionResponseDto> {
  @ApiProperty({ type: [CollectionResponseDto] })
  data!: CollectionResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<CollectionResponseDto>['meta'];
}
