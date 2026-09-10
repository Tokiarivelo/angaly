import { ApiProperty } from '@nestjs/swagger';
import { FavoriteEntityType } from '@angaly/types';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ enum: FavoriteEntityType })
  @IsEnum(FavoriteEntityType)
  entityType!: FavoriteEntityType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  entityId!: string;
}
