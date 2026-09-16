import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { CreateConversationInput, IConversationRepository } from '../../domain/repositories/conversation.repository';
import { ConversationMapper } from '../mappers/conversation.mapper';

/** Unread count = STAFF-authored, unread messages — the CLIENT's own unread badge (see docs/features/messages.md). */
const UNREAD_MESSAGES_COUNT_ARGS = {
  select: { messages: { where: { senderRole: 'STAFF' as const, isRead: false } } },
};

const CONVERSATION_INCLUDE = {
  atelier: true,
  _count: UNREAD_MESSAGES_COUNT_ARGS,
} as const;

@Injectable()
export class PrismaConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ConversationEntity | null> {
    const row = await this.prisma.conversation.findUnique({ where: { id }, include: CONVERSATION_INCLUDE });
    if (!row) return null;
    return ConversationMapper.toDomain(row);
  }

  async findByCustomerAndAtelier(customerId: string, atelierId: string): Promise<ConversationEntity | null> {
    const row = await this.prisma.conversation.findUnique({
      where: { customerId_atelierId: { customerId, atelierId } },
      include: CONVERSATION_INCLUDE,
    });
    if (!row) return null;
    return ConversationMapper.toDomain(row);
  }

  async findByCustomerId(customerId: string): Promise<ConversationEntity[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { customerId },
      include: CONVERSATION_INCLUDE,
      orderBy: { lastMessageAt: 'desc' },
    });
    return rows.map((row) => ConversationMapper.toDomain(row));
  }

  async findAll(): Promise<ConversationEntity[]> {
    const rows = await this.prisma.conversation.findMany({
      include: CONVERSATION_INCLUDE,
      orderBy: { lastMessageAt: 'desc' },
    });
    return rows.map((row) => ConversationMapper.toDomain(row));
  }

  async create(input: CreateConversationInput): Promise<ConversationEntity> {
    const row = await this.prisma.conversation.create({
      data: {
        id: input.id,
        customerId: input.customerId,
        atelierId: input.atelierId,
        relatedEntityType: input.relatedEntityType ?? undefined,
        relatedEntityId: input.relatedEntityId ?? undefined,
        lastMessagePreview: input.lastMessagePreview,
        lastMessageAt: input.lastMessageAt,
      },
      include: CONVERSATION_INCLUDE,
    });
    return ConversationMapper.toDomain(row);
  }

  async updateLastMessage(id: string, preview: string, at: Date): Promise<void> {
    await this.prisma.conversation.update({
      where: { id },
      data: { lastMessagePreview: preview, lastMessageAt: at },
    });
  }
}
