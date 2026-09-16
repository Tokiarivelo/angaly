import { NotFoundException } from '@nestjs/common';

import type { IAtelierRepository } from '../../../ateliers/domain/repositories/atelier.repository';
import { AtelierEntity } from '../../../ateliers/domain/entities/atelier.entity';
import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import type { IConversationRepository } from '../../domain/repositories/conversation.repository';
import type { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';

const CLOSED_WEEK = {
  monday: { isOpen: false, slots: [] },
  tuesday: { isOpen: false, slots: [] },
  wednesday: { isOpen: false, slots: [] },
  thursday: { isOpen: false, slots: [] },
  friday: { isOpen: false, slots: [] },
  saturday: { isOpen: false, slots: [] },
  sunday: { isOpen: false, slots: [] },
};

function sampleAtelier(): AtelierEntity {
  return AtelierEntity.create({
    id: 'atelier-1',
    slug: 'atelier-antananarivo',
    name: 'Atelier Antananarivo',
    address: '1 rue de la Couture',
    city: 'Antananarivo',
    phone: null,
    openingHours: CLOSED_WEEK,
    services: [],
    latitude: null,
    longitude: null,
    media: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleConversation(): ConversationEntity {
  return ConversationEntity.create({
    id: 'conv-1',
    customerId: 'customer-1',
    atelierId: 'atelier-1',
    atelierName: 'Atelier Antananarivo',
    relatedEntityType: 'Order',
    relatedEntityId: 'order-1',
    lastMessagePreview: 'Bonjour',
    lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    unreadCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildConversationRepository(existing: ConversationEntity | null = null): jest.Mocked<IConversationRepository> {
  return {
    findById: jest.fn(),
    findByCustomerAndAtelier: jest.fn().mockResolvedValue(existing),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn().mockResolvedValue(sampleConversation()),
    updateLastMessage: jest.fn(),
  };
}

function buildCustomerRepository(customer: CustomerEntity | null = sampleCustomer()): jest.Mocked<ICustomerRepository> {
  return { findByUserId: jest.fn(), findById: jest.fn().mockResolvedValue(customer), update: jest.fn() };
}

function buildAtelierRepository(atelier: AtelierEntity | null = sampleAtelier()): jest.Mocked<IAtelierRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn().mockResolvedValue(atelier), list: jest.fn() };
}

function buildSendMessageUseCase(): jest.Mocked<Pick<SendMessageUseCase, 'execute'>> {
  return {
    execute: jest.fn().mockResolvedValue(
      MessageEntity.create({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderRole: 'STAFF',
        senderUserId: 'staff-user',
        content: 'Bonjour, votre commande est prête pour un premier essayage.',
        isRead: false,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ),
  };
}

describe('StartConversationUseCase', () => {
  it('returns 404 for an unknown customer', async () => {
    const useCase = new StartConversationUseCase(
      buildConversationRepository(),
      buildCustomerRepository(null),
      buildAtelierRepository(),
      buildSendMessageUseCase() as unknown as SendMessageUseCase,
    );

    await expect(
      useCase.execute({ senderUserId: 'staff-user', role: 'COUTURIERE', customerId: 'missing', atelierId: 'atelier-1', content: 'Bonjour' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 404 for an unknown atelier', async () => {
    const useCase = new StartConversationUseCase(
      buildConversationRepository(),
      buildCustomerRepository(),
      buildAtelierRepository(null),
      buildSendMessageUseCase() as unknown as SendMessageUseCase,
    );

    await expect(
      useCase.execute({ senderUserId: 'staff-user', role: 'COUTURIERE', customerId: 'customer-1', atelierId: 'missing', content: 'Bonjour' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a new conversation when none exists for the (customer, atelier) pair', async () => {
    const conversationRepository = buildConversationRepository(null);
    const sendMessageUseCase = buildSendMessageUseCase();
    const useCase = new StartConversationUseCase(
      conversationRepository,
      buildCustomerRepository(),
      buildAtelierRepository(),
      sendMessageUseCase as unknown as SendMessageUseCase,
    );

    await useCase.execute({
      senderUserId: 'staff-user',
      role: 'COUTURIERE',
      customerId: 'customer-1',
      atelierId: 'atelier-1',
      content: 'Bonjour, votre commande est prête pour un premier essayage.',
      relatedEntityType: 'Order',
      relatedEntityId: 'order-1',
    });

    expect(conversationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer-1', atelierId: 'atelier-1', relatedEntityType: 'Order', relatedEntityId: 'order-1' }),
    );
    expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      senderUserId: 'staff-user',
      role: 'COUTURIERE',
      content: 'Bonjour, votre commande est prête pour un premier essayage.',
    });
  });

  it('reuses the existing conversation for the (customer, atelier) pair instead of creating a new one', async () => {
    const conversationRepository = buildConversationRepository(sampleConversation());
    const sendMessageUseCase = buildSendMessageUseCase();
    const useCase = new StartConversationUseCase(
      conversationRepository,
      buildCustomerRepository(),
      buildAtelierRepository(),
      sendMessageUseCase as unknown as SendMessageUseCase,
    );

    await useCase.execute({ senderUserId: 'staff-user', role: 'MANAGER', customerId: 'customer-1', atelierId: 'atelier-1', content: 'Suite' });

    expect(conversationRepository.create).not.toHaveBeenCalled();
    expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      senderUserId: 'staff-user',
      role: 'MANAGER',
      content: 'Suite',
    });
  });
});
