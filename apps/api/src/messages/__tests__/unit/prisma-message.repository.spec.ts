import type { PrismaService } from '../../../prisma/prisma.service';
import { MessageEntity } from '../../domain/entities/message.entity';
import { PrismaMessageRepository } from '../../infrastructure/repositories/prisma-message.repository';

interface MockMessageDelegate {
  create: jest.Mock;
  findMany: jest.Mock;
  updateMany: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; message: MockMessageDelegate } {
  const message: MockMessageDelegate = { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() };
  const prisma = { message } as unknown as PrismaService;
  return { prisma, message };
}

function domainMessage(): MessageEntity {
  return MessageEntity.create({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderRole: 'CLIENT',
    senderUserId: 'user-1',
    content: 'Bonjour',
    isRead: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('PrismaMessageRepository', () => {
  it('create() writes the message', async () => {
    const { prisma, message } = buildPrismaServiceMock();

    await new PrismaMessageRepository(prisma).create(domainMessage());

    const call = message.create.mock.calls[0]?.[0] as { data: { id: string; conversationId: string; senderRole: string } };
    expect(call.data.id).toBe('msg-1');
    expect(call.data.conversationId).toBe('conv-1');
    expect(call.data.senderRole).toBe('CLIENT');
  });

  it('findByConversationId() lists oldest-first for the conversation', async () => {
    const { prisma, message } = buildPrismaServiceMock();
    message.findMany.mockResolvedValue([]);

    await new PrismaMessageRepository(prisma).findByConversationId('conv-1');

    expect(message.findMany).toHaveBeenCalledWith({ where: { conversationId: 'conv-1' }, orderBy: { createdAt: 'asc' } });
  });

  it('markStaffMessagesRead() only updates unread STAFF messages for that conversation', async () => {
    const { prisma, message } = buildPrismaServiceMock();

    await new PrismaMessageRepository(prisma).markStaffMessagesRead('conv-1');

    expect(message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-1', senderRole: 'STAFF', isRead: false },
      data: { isRead: true },
    });
  });
});
