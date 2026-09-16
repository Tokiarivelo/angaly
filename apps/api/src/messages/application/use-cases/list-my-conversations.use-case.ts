import { Inject, Injectable } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { CONVERSATION_REPOSITORY, IConversationRepository } from '../../domain/repositories/conversation.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

/** `COUTURIERE`/`MANAGER`/`ADMIN` handle client communication in this MVP (no assignment system yet) — see docs/features/messages.md. */
export const MESSAGE_STAFF_ROLES: UserRole[] = ['COUTURIERE', 'MANAGER', 'ADMIN'];

/** `CLIENT` sees their own conversations; staff sees every conversation. */
@Injectable()
export class ListMyConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: IConversationRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(userId: string, role: UserRole): Promise<ConversationEntity[]> {
    if (MESSAGE_STAFF_ROLES.includes(role)) {
      return this.conversationRepository.findAll();
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    return this.conversationRepository.findByCustomerId(customerId);
  }
}
