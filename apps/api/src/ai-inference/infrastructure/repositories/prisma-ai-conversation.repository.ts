import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IAIConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import { AIConversationMessage } from '../../domain/entities/ai-conversation-message.entity';
import { AIConversationRole } from '@angaly/database';

@Injectable()
export class PrismaAIConversationRepository implements IAIConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(
    role: 'USER' | 'ASSISTANT',
    message: string,
    customerId?: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage> {
    const row = await this.prisma.aIConversation.create({
      data: {
        role: role as AIConversationRole,
        message,
        customerId,
        patternProjectId,
      },
    });

    return new AIConversationMessage(
      row.id,
      row.role,
      row.message,
      row.createdAt,
      row.customerId || undefined,
      row.patternProjectId || undefined,
    );
  }

  async findHistory(
    customerId?: string,
    patternProjectId?: string,
  ): Promise<AIConversationMessage[]> {
    const rows = await this.prisma.aIConversation.findMany({
      where: {
        customerId: customerId || undefined,
        patternProjectId: patternProjectId || undefined,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(
      (row: any) =>
        new AIConversationMessage(
          row.id,
          row.role,
          row.message,
          row.createdAt,
          row.customerId || undefined,
          row.patternProjectId || undefined,
        ),
    );
  }
}
