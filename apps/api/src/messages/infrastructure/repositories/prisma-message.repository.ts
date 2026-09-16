import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { MessageEntity } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../domain/repositories/message.repository';
import { MessageMapper } from '../mappers/message.mapper';

@Injectable()
export class PrismaMessageRepository implements IMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(message: MessageEntity): Promise<void> {
    await this.prisma.message.create({
      data: {
        id: message.id,
        conversationId: message.conversationId,
        senderRole: message.senderRole,
        senderUserId: message.senderUserId,
        content: message.content,
        isRead: message.isRead,
      },
    });
  }

  async findByConversationId(conversationId: string): Promise<MessageEntity[]> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => MessageMapper.toDomain(row));
  }

  async markStaffMessagesRead(conversationId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: { conversationId, senderRole: 'STAFF', isRead: false },
      data: { isRead: true },
    });
  }
}
