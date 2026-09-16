import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { ATELIER_REPOSITORY, IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { MessageEntity } from '../../domain/entities/message.entity';
import { CONVERSATION_REPOSITORY, IConversationRepository } from '../../domain/repositories/conversation.repository';
import { SendMessageUseCase } from './send-message.use-case';

export interface StartConversationCommand {
  senderUserId: string;
  role: UserRole;
  customerId: string;
  atelierId: string;
  content: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

/**
 * Staff-only entry point that decides how a *new* conversation comes to
 * exist: find-or-create by (customerId, atelierId) — one open conversation
 * per pair — then append the first message. `relatedEntityType`/`Id` are
 * only recorded when the conversation is actually created; a message sent
 * into an already-existing conversation never overwrites them. See
 * docs/features/messages.md "Comment une nouvelle conversation est créée".
 * No `CLIENT`-facing route calls this — the frontend only ever appends to a
 * thread it can already see (see `send-message.use-case.ts`).
 */
@Injectable()
export class StartConversationUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: IConversationRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    @Inject(ATELIER_REPOSITORY) private readonly atelierRepository: IAtelierRepository,
    private readonly sendMessageUseCase: SendMessageUseCase,
  ) {}

  async execute(command: StartConversationCommand): Promise<MessageEntity> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new NotFoundException(`Customer ${command.customerId} not found`);
    }

    const atelier = await this.atelierRepository.findById(command.atelierId);
    if (!atelier) {
      throw new NotFoundException(`Atelier ${command.atelierId} not found`);
    }

    const conversation =
      (await this.conversationRepository.findByCustomerAndAtelier(command.customerId, command.atelierId)) ??
      (await this.conversationRepository.create({
        id: randomUUID(),
        customerId: command.customerId,
        atelierId: command.atelierId,
        relatedEntityType: command.relatedEntityType ?? null,
        relatedEntityId: command.relatedEntityId ?? null,
        lastMessagePreview: command.content,
        lastMessageAt: new Date(),
      }));

    return this.sendMessageUseCase.execute({
      conversationId: conversation.id,
      senderUserId: command.senderUserId,
      role: command.role,
      content: command.content,
    });
  }
}
