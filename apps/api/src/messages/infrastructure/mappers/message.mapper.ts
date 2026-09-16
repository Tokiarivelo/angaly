import type { Message as PrismaMessage } from '@angaly/database';
import type { MessageSenderRole as SharedMessageSenderRole } from '@angaly/types';

import { MessageResponseDto } from '../../application/dtos/message-response.dto';
import { MessageEntity } from '../../domain/entities/message.entity';

export class MessageMapper {
  static toDomain(row: PrismaMessage): MessageEntity {
    return MessageEntity.create({
      id: row.id,
      conversationId: row.conversationId,
      senderRole: row.senderRole,
      senderUserId: row.senderUserId,
      content: row.content,
      isRead: row.isRead,
      createdAt: row.createdAt,
    });
  }

  static toResponseDto(message: MessageEntity): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = message.id;
    dto.conversationId = message.conversationId;
    dto.senderRole = message.senderRole as unknown as SharedMessageSenderRole;
    dto.senderUserId = message.senderUserId;
    dto.content = message.content;
    dto.isRead = message.isRead;
    dto.createdAt = message.createdAt.toISOString();
    return dto;
  }
}
