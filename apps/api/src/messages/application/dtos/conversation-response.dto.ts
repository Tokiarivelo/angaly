import { ApiProperty } from '@nestjs/swagger';
import type { ConversationDto } from '@angaly/types';

export class ConversationResponseDto implements ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  atelierId!: string;

  @ApiProperty()
  atelierName!: string;

  @ApiProperty({ nullable: true, type: String })
  relatedEntityType!: string | null;

  @ApiProperty({ nullable: true, type: String })
  relatedEntityId!: string | null;

  @ApiProperty()
  lastMessagePreview!: string;

  @ApiProperty()
  lastMessageAt!: string;

  @ApiProperty()
  unreadCount!: number;

  @ApiProperty()
  createdAt!: string;
}
