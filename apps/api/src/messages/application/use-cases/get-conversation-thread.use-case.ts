import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { MessageEntity } from '../../domain/entities/message.entity';
import { CONVERSATION_REPOSITORY, IConversationRepository } from '../../domain/repositories/conversation.repository';
import { IMessageRepository, MESSAGE_REPOSITORY } from '../../domain/repositories/message.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';
import { MESSAGE_STAFF_ROLES } from './list-my-conversations.use-case';

/**
 * Owner-only for `CLIENT` (staff can view any conversation — no assignment
 * system in this MVP). Marks every STAFF-authored message as read when the
 * owning CLIENT opens the thread — staff opening it does not affect the
 * client's own read state.
 */
@Injectable()
export class GetConversationThreadUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(conversationId: string, userId: string, role: UserRole): Promise<MessageEntity[]> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const isStaff = MESSAGE_STAFF_ROLES.includes(role);
    if (!isStaff) {
      const customerId = await resolveCustomerId(this.customerRepository, userId);
      if (conversation.customerId !== customerId) {
        throw new ForbiddenException('This conversation does not belong to the current user');
      }
      await this.messageRepository.markStaffMessagesRead(conversationId);
    }

    return this.messageRepository.findByConversationId(conversationId);
  }
}
