import type { Atelier as PrismaAtelier, Conversation as PrismaConversation } from '@angaly/database';

import { ConversationResponseDto } from '../../application/dtos/conversation-response.dto';
import { ConversationEntity } from '../../domain/entities/conversation.entity';

export type PrismaConversationWithRelations = PrismaConversation & {
  atelier: PrismaAtelier;
  _count: { messages: number };
};

export class ConversationMapper {
  static toDomain(row: PrismaConversationWithRelations): ConversationEntity {
    return ConversationEntity.create({
      id: row.id,
      customerId: row.customerId,
      atelierId: row.atelierId,
      atelierName: row.atelier.name,
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      lastMessagePreview: row.lastMessagePreview,
      lastMessageAt: row.lastMessageAt,
      unreadCount: row._count.messages,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toResponseDto(conversation: ConversationEntity): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    dto.id = conversation.id;
    dto.customerId = conversation.customerId;
    dto.atelierId = conversation.atelierId;
    dto.atelierName = conversation.atelierName;
    dto.relatedEntityType = conversation.relatedEntityType;
    dto.relatedEntityId = conversation.relatedEntityId;
    dto.lastMessagePreview = conversation.lastMessagePreview;
    dto.lastMessageAt = conversation.lastMessageAt.toISOString();
    dto.unreadCount = conversation.unreadCount;
    dto.createdAt = conversation.createdAt.toISOString();
    return dto;
  }
}
