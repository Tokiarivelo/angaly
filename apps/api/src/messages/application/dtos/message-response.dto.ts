import { ApiProperty } from '@nestjs/swagger';
import { MessageDto, MessageSenderRole } from '@angaly/types';

export class MessageResponseDto implements MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: MessageSenderRole })
  senderRole!: MessageSenderRole;

  @ApiProperty()
  senderUserId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: string;
}
