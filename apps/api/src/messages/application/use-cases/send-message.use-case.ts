import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import { MessageEntity } from '../../domain/entities/message.entity';
import { CONVERSATION_REPOSITORY, IConversationRepository } from '../../domain/repositories/conversation.repository';
import { IMessageRepository, MESSAGE_REPOSITORY } from '../../domain/repositories/message.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';
import { MESSAGE_STAFF_ROLES } from './list-my-conversations.use-case';

const PREVIEW_MAX_LENGTH = 140;

export interface SendMessageCommand {
  conversationId: string;
  senderUserId: string;
  role: UserRole;
  content: string;
}

/**
 * Appends a message to an EXISTING conversation the caller owns (`CLIENT`)
 * or may reply to (staff — no assignment system in this MVP). Starting a
 * brand-new conversation is a separate flow, see `start-conversation.use-case.ts`
 * and docs/features/messages.md.
 */
@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(command: SendMessageCommand): Promise<MessageEntity> {
    const conversation = await this.conversationRepository.findById(command.conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation ${command.conversationId} not found`);
    }

    const isStaff = MESSAGE_STAFF_ROLES.includes(command.role);
    if (!isStaff) {
      const customerId = await resolveCustomerId(this.customerRepository, command.senderUserId);
      if (conversation.customerId !== customerId) {
        throw new ForbiddenException('This conversation does not belong to the current user');
      }
    }

    const now = new Date();
    const message = MessageEntity.create({
      id: randomUUID(),
      conversationId: conversation.id,
      senderRole: isStaff ? 'STAFF' : 'CLIENT',
      senderUserId: command.senderUserId,
      content: command.content,
      isRead: !isStaff, // a CLIENT-authored message has nothing for the client to "read back"
      createdAt: now,
    });

    await this.messageRepository.create(message);
    await this.conversationRepository.updateLastMessage(conversation.id, this.buildPreview(message.content), now);

    if (isStaff) {
      await this.notifyCustomer(conversation.customerId, conversation.atelierName, conversation.id, message.content);
    }

    return message;
  }

  private buildPreview(content: string): string {
    return content.length > PREVIEW_MAX_LENGTH ? `${content.slice(0, PREVIEW_MAX_LENGTH)}…` : content;
  }

  private async notifyCustomer(customerId: string, atelierName: string, conversationId: string, content: string): Promise<void> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) return;

      await this.createNotificationUseCase.execute({
        userId: customer.userId,
        type: 'MESSAGE_RECEIVED',
        title: `Nouveau message de ${atelierName}`,
        body: content,
        relatedEntityType: 'Conversation',
        relatedEntityId: conversationId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit MESSAGE_RECEIVED for conversation ${conversationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
