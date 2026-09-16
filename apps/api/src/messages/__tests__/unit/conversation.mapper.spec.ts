import type { PrismaConversationWithRelations } from '../../infrastructure/mappers/conversation.mapper';
import { ConversationMapper } from '../../infrastructure/mappers/conversation.mapper';

function row(overrides: Partial<PrismaConversationWithRelations> = {}): PrismaConversationWithRelations {
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
    atelier: { id: 'atelier-1', name: 'Atelier Antananarivo' } as PrismaConversationWithRelations['atelier'],
    _count: { messages: 3 },
    ...overrides,
  };
}

describe('ConversationMapper', () => {
  it('toDomain() hydrates atelierName from the joined atelier row', () => {
    const conversation = ConversationMapper.toDomain(row());

    expect(conversation.atelierName).toBe('Atelier Antananarivo');
  });

  it('toDomain() hydrates unreadCount from the filtered _count', () => {
    const conversation = ConversationMapper.toDomain(row());

    expect(conversation.unreadCount).toBe(3);
  });

  it('toResponseDto() serializes dates to ISO strings', () => {
    const dto = ConversationMapper.toResponseDto(ConversationMapper.toDomain(row()));

    expect(dto.lastMessageAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.atelierName).toBe('Atelier Antananarivo');
    expect(dto.unreadCount).toBe(3);
  });
});
