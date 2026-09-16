import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import type { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import type { IConversationRepository } from '../../domain/repositories/conversation.repository';
import type { IMessageRepository } from '../../domain/repositories/message.repository';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';

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
    unreadCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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
  return { create: jest.fn(), findByConversationId: jest.fn(), markStaffMessagesRead: jest.fn() };
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
  return { findByUserId: jest.fn().mockResolvedValue(customer), findById: jest.fn().mockResolvedValue(customer), update: jest.fn() };
}

function buildCreateNotificationUseCase(): jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>> {
  return { execute: jest.fn().mockResolvedValue(undefined) };
}

describe('SendMessageUseCase', () => {
  it('returns 404 for an unknown conversation', async () => {
    const useCase = new SendMessageUseCase(
      buildConversationRepository(null),
      buildMessageRepository(),
      buildCustomerRepository(),
      buildCreateNotificationUseCase() as unknown as CreateNotificationUseCase,
    );

    await expect(useCase.execute({ conversationId: 'missing', senderUserId: 'user-1', role: 'CLIENT', content: 'Bonjour' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("rejects a CLIENT sending into another customer's conversation", async () => {
    const useCase = new SendMessageUseCase(
      buildConversationRepository(sampleConversation('other-customer')),
      buildMessageRepository(),
      buildCustomerRepository(),
      buildCreateNotificationUseCase() as unknown as CreateNotificationUseCase,
    );

    await expect(useCase.execute({ conversationId: 'conv-1', senderUserId: 'user-1', role: 'CLIENT', content: 'Bonjour' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('appends a CLIENT message, marks it already read, and never notifies', async () => {
    const messageRepository = buildMessageRepository();
    const conversationRepository = buildConversationRepository();
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new SendMessageUseCase(
      conversationRepository,
      messageRepository,
      buildCustomerRepository(),
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    );

    const message = await useCase.execute({ conversationId: 'conv-1', senderUserId: 'user-1', role: 'CLIENT', content: 'Où en est ma commande ?' });

    expect(message.senderRole).toBe('CLIENT');
    expect(message.isRead).toBe(true);
    expect(messageRepository.create).toHaveBeenCalledWith(message);
    expect(conversationRepository.updateLastMessage).toHaveBeenCalledWith('conv-1', 'Où en est ma commande ?', expect.any(Date));
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('appends a STAFF message, leaves it unread, and emits MESSAGE_RECEIVED best-effort', async () => {
    const messageRepository = buildMessageRepository();
    const createNotificationUseCase = buildCreateNotificationUseCase();
    const useCase = new SendMessageUseCase(
      buildConversationRepository(),
      messageRepository,
      buildCustomerRepository(),
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    );

    const message = await useCase.execute({ conversationId: 'conv-1', senderUserId: 'staff-user', role: 'COUTURIERE', content: 'Votre commande avance bien.' });

    expect(message.senderRole).toBe('STAFF');
    expect(message.isRead).toBe(false);
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'MESSAGE_RECEIVED',
        relatedEntityType: 'Conversation',
        relatedEntityId: 'conv-1',
      }),
    );
  });

  it('never fails the send when the notification best-effort call throws', async () => {
    const createNotificationUseCase = { execute: jest.fn().mockRejectedValue(new Error('DB down')) };
    const useCase = new SendMessageUseCase(
      buildConversationRepository(),
      buildMessageRepository(),
      buildCustomerRepository(),
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    );

    await expect(
      useCase.execute({ conversationId: 'conv-1', senderUserId: 'staff-user', role: 'ADMIN', content: 'Votre commande avance bien.' }),
    ).resolves.toBeDefined();
  });

  it('truncates a long preview to 140 characters', async () => {
    const conversationRepository = buildConversationRepository();
    const useCase = new SendMessageUseCase(
      conversationRepository,
      buildMessageRepository(),
      buildCustomerRepository(),
      buildCreateNotificationUseCase() as unknown as CreateNotificationUseCase,
    );
    const longContent = 'a'.repeat(200);

    await useCase.execute({ conversationId: 'conv-1', senderUserId: 'user-1', role: 'CLIENT', content: longContent });

    const [, preview] = conversationRepository.updateLastMessage.mock.calls[0];
    expect(preview).toHaveLength(141);
    expect(preview.endsWith('…')).toBe(true);
  });
});
