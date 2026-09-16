import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaConversationRepository } from '../../infrastructure/repositories/prisma-conversation.repository';

interface MockConversationDelegate {
  findUnique: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; conversation: MockConversationDelegate } {
  const conversation: MockConversationDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { conversation } as unknown as PrismaService;
  return { prisma, conversation };
}

function conversationRecord() {
  return {
    id: 'conv-1',
    customerId: 'customer-1',
    atelierId: 'atelier-1',
    relatedEntityType: null,
    relatedEntityId: null,
    lastMessagePreview: 'Bonjour',
    lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    atelier: { id: 'atelier-1', name: 'Atelier Antananarivo' },
    _count: { messages: 1 },
  };
}

describe('PrismaConversationRepository', () => {
  it('findById() returns null when no row matches', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.findUnique.mockResolvedValue(null);

    expect(await new PrismaConversationRepository(prisma).findById('missing')).toBeNull();
  });

  it('findById() maps a found row (joined atelier + unread count) to a domain entity', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.findUnique.mockResolvedValue(conversationRecord());

    const result = await new PrismaConversationRepository(prisma).findById('conv-1');

    expect(result?.atelierName).toBe('Atelier Antananarivo');
    expect(result?.unreadCount).toBe(1);
  });

  it('findByCustomerAndAtelier() queries the compound unique key', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.findUnique.mockResolvedValue(null);

    await new PrismaConversationRepository(prisma).findByCustomerAndAtelier('customer-1', 'atelier-1');

    expect(conversation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId_atelierId: { customerId: 'customer-1', atelierId: 'atelier-1' } } }),
    );
  });

  it('findByCustomerId() lists newest-first for that customer', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.findMany.mockResolvedValue([conversationRecord()]);

    const result = await new PrismaConversationRepository(prisma).findByCustomerId('customer-1');

    expect(conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'customer-1' }, orderBy: { lastMessageAt: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('findAll() lists every conversation, newest-first', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.findMany.mockResolvedValue([conversationRecord()]);

    await new PrismaConversationRepository(prisma).findAll();

    expect(conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { lastMessageAt: 'desc' } }));
  });

  it('create() writes the conversation and returns the hydrated entity', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    conversation.create.mockResolvedValue(conversationRecord());

    const result = await new PrismaConversationRepository(prisma).create({
      id: 'conv-1',
      customerId: 'customer-1',
      atelierId: 'atelier-1',
      relatedEntityType: 'Order',
      relatedEntityId: 'order-1',
      lastMessagePreview: 'Bonjour',
      lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const call = conversation.create.mock.calls[0]?.[0] as { data: { customerId: string; atelierId: string } };
    expect(call.data.customerId).toBe('customer-1');
    expect(call.data.atelierId).toBe('atelier-1');
    expect(result.atelierName).toBe('Atelier Antananarivo');
  });

  it('updateLastMessage() updates preview and timestamp', async () => {
    const { prisma, conversation } = buildPrismaServiceMock();
    const at = new Date('2026-01-02T00:00:00.000Z');

    await new PrismaConversationRepository(prisma).updateLastMessage('conv-1', 'Nouveau message', at);

    expect(conversation.update).toHaveBeenCalledWith({ where: { id: 'conv-1' }, data: { lastMessagePreview: 'Nouveau message', lastMessageAt: at } });
  });
});
