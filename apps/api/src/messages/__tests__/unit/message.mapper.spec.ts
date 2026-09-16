import type { Message as PrismaMessage } from '@angaly/database';

import { MessageMapper } from '../../infrastructure/mappers/message.mapper';

function row(overrides: Partial<PrismaMessage> = {}): PrismaMessage {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderRole: 'STAFF',
    senderUserId: 'staff-user',
    content: 'Votre commande avance bien.',
    isRead: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('MessageMapper', () => {
  it('toDomain() maps a row to a domain entity', () => {
    const message = MessageMapper.toDomain(row());

    expect(message.id).toBe('msg-1');
    expect(message.senderRole).toBe('STAFF');
  });

  it('toResponseDto() serializes createdAt to an ISO string', () => {
    const dto = MessageMapper.toResponseDto(MessageMapper.toDomain(row()));

    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.content).toBe('Votre commande avance bien.');
  });
});
