import { ApiProperty } from '@nestjs/swagger';

import { MediaResponseDto } from './media-response.dto';

export class MediaUsageResponseDto {
  @ApiProperty()
  entityType!: string;

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  label!: string;
}

export class MediaDetailResponseDto extends MediaResponseDto {
  @ApiProperty({ type: [MediaUsageResponseDto] })
  usedIn!: MediaUsageResponseDto[];
}
