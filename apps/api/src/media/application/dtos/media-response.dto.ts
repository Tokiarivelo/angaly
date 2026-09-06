import { ApiProperty } from '@nestjs/swagger';
import { MediaDto, MediaEntityType, PaginatedResponse } from '@angaly/types';

export class MediaResponseDto implements MediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ nullable: true })
  altText!: string | null;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({ nullable: true })
  width!: number | null;

  @ApiProperty({ nullable: true })
  height!: number | null;

  @ApiProperty({ enum: MediaEntityType })
  entityType!: MediaEntityType;

  @ApiProperty({ nullable: true })
  entityId!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;
}

export class PaginatedMediaResponseDto implements PaginatedResponse<MediaResponseDto> {
  @ApiProperty({ type: [MediaResponseDto] })
  data!: MediaResponseDto[];

  @ApiProperty()
  meta!: PaginatedResponse<MediaResponseDto>['meta'];
}
