import { ApiProperty } from '@nestjs/swagger';
import { FavoriteDisplayDto, FavoriteDto, FavoriteEntityType } from '@angaly/types';

export class FavoriteDisplayResponseDto implements FavoriteDisplayDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;
}

export class FavoriteResponseDto implements FavoriteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: FavoriteEntityType })
  entityType!: FavoriteEntityType;

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ nullable: true, type: FavoriteDisplayResponseDto })
  display!: FavoriteDisplayResponseDto | null;
}
