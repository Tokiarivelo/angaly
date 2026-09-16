import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import type { IConversationRepository } from '../../domain/repositories/conversation.repository';
import type { IMessageRepository } from '../../domain/repositories/message.repository';
import { GetConversationThreadUseCase } from '../../application/use-cases/get-conversation-thread.use-case';

function sampleConversation(customerId = 'customer-1'): ConversationEntity {
  return ConversationEntity.create({
    id: 'conv-1',
    customerId,
    atelierId: 'atelier-1',
    atelierName: 'Atelier Antananarivo',
    relatedEntityType: null,
    relatedEntityId: null,
    lastMessagePreview: 'Bonjour',
    lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    unreadCount: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function sampleMessage(): MessageEntity {
  return MessageEntity.create({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderRole: 'STAFF',
    senderUserId: 'staff-user',
    content: 'Votre commande avance bien.',
    isRead: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildConversationRepository(conversation: ConversationEntity | null = sampleConversation()): jest.Mocked<IConversationRepository> {
  return {
    findById: jest.fn().mockResolvedValue(conversation),
    findByCustomerAndAtelier: jest.fn(),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    updateLastMessage: jest.fn(),
  };
}

function buildMessageRepository(): jest.Mocked<IMessageRepository> {
  return {
    create: jest.fn(),
    findByConversationId: jest.fn().mockResolvedValue([sampleMessage()]),
    markStaffMessagesRead: jest.fn(),
  };
}

function buildCustomerRepository(): jest.Mocked<ICustomerRepository> {
  const customer = CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn(), update: jest.fn() };
}

describe('GetConversationThreadUseCase', () => {
  it('returns 404 for an unknown conversation', async () => {
    const useCase = new GetConversationThreadUseCase(buildConversationRepository(null), buildMessageRepository(), buildCustomerRepository());

    await expect(useCase.execute('missing', 'user-1', 'CLIENT')).rejects.toThrow(NotFoundException);
  });

  it("returns 403 for another customer's conversation", async () => {
    const useCase = new GetConversationThreadUseCase(
      buildConversationRepository(sampleConversation('other-customer')),
      buildMessageRepository(),
      buildCustomerRepository(),
    );

    await expect(useCase.execute('conv-1', 'user-1', 'CLIENT')).rejects.toThrow(ForbiddenException);
  });

  it('marks staff messages as read and returns messages for the owning CLIENT', async () => {
    const messageRepository = buildMessageRepository();
    const useCase = new GetConversationThreadUseCase(buildConversationRepository(), messageRepository, buildCustomerRepository());

    const messages = await useCase.execute('conv-1', 'user-1', 'CLIENT');

    expect(messages).toHaveLength(1);
    expect(messageRepository.markStaffMessagesRead).toHaveBeenCalledWith('conv-1');
  });

  it('does not mark messages read when a staff member views the thread', async () => {
    const messageRepository = buildMessageRepository();
    const useCase = new GetConversationThreadUseCase(buildConversationRepository(), messageRepository, buildCustomerRepository());

    await useCase.execute('conv-1', 'staff-user', 'MANAGER');

    expect(messageRepository.markStaffMessagesRead).not.toHaveBeenCalled();
  });
});
