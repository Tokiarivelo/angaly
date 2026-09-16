import { CustomerEntity } from '../../../customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import type { IConversationRepository } from '../../domain/repositories/conversation.repository';
import { ListMyConversationsUseCase } from '../../application/use-cases/list-my-conversations.use-case';

function sampleConversation(id: string, customerId: string): ConversationEntity {
  return ConversationEntity.create({
    id,
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

function buildConversationRepository(): jest.Mocked<IConversationRepository> {
  return {
    findById: jest.fn(),
    findByCustomerAndAtelier: jest.fn(),
    findByCustomerId: jest.fn().mockResolvedValue([sampleConversation('conv-1', 'customer-1')]),
    findAll: jest.fn().mockResolvedValue([sampleConversation('conv-1', 'customer-1'), sampleConversation('conv-2', 'customer-2')]),
    create: jest.fn(),
    updateLastMessage: jest.fn(),
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

describe('ListMyConversationsUseCase', () => {
  it("returns only the caller's own conversations for CLIENT", async () => {
    const conversationRepository = buildConversationRepository();
    const useCase = new ListMyConversationsUseCase(conversationRepository, buildCustomerRepository());

    const conversations = await useCase.execute('user-1', 'CLIENT');

    expect(conversations).toHaveLength(1);
    expect(conversationRepository.findByCustomerId).toHaveBeenCalledWith('customer-1');
    expect(conversationRepository.findAll).not.toHaveBeenCalled();
  });

  it('returns every conversation for COUTURIERE', async () => {
    const conversationRepository = buildConversationRepository();
    const useCase = new ListMyConversationsUseCase(conversationRepository, buildCustomerRepository());

    const conversations = await useCase.execute('staff-user', 'COUTURIERE');

    expect(conversations).toHaveLength(2);
    expect(conversationRepository.findByCustomerId).not.toHaveBeenCalled();
  });

  it('returns every conversation for MANAGER and ADMIN', async () => {
    const conversationRepository = buildConversationRepository();
    const useCase = new ListMyConversationsUseCase(conversationRepository, buildCustomerRepository());

    expect(await useCase.execute('staff-user', 'MANAGER')).toHaveLength(2);
    expect(await useCase.execute('staff-user', 'ADMIN')).toHaveLength(2);
  });
});
