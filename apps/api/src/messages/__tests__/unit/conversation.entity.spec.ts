import { ConversationEntity } from '../../domain/entities/conversation.entity';

function sampleProps(overrides: Partial<Parameters<typeof ConversationEntity.create>[0]> = {}) {
  return {
    id: 'conv-1',
    customerId: 'customer-1',
    atelierId: 'atelier-1',
    atelierName: 'Atelier Antananarivo',
    relatedEntityType: 'Order' as string | null,
    relatedEntityId: 'order-1' as string | null,
    lastMessagePreview: 'Bonjour, votre commande avance bien.',
    lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
    unreadCount: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ConversationEntity', () => {
  it('creates a valid conversation', () => {
    const conversation = ConversationEntity.create(sampleProps());

    expect(conversation.id).toBe('conv-1');
    expect(conversation.atelierName).toBe('Atelier Antananarivo');
    expect(conversation.unreadCount).toBe(2);
  });

  it('rejects an empty customerId', () => {
    expect(() => ConversationEntity.create(sampleProps({ customerId: '  ' }))).toThrow('customerId must not be empty');
  });

  it('rejects an empty atelierId', () => {
    expect(() => ConversationEntity.create(sampleProps({ atelierId: '' }))).toThrow('atelierId must not be empty');
  });

  it('rejects an empty atelierName', () => {
    expect(() => ConversationEntity.create(sampleProps({ atelierName: '  ' }))).toThrow('atelierName must not be empty');
  });

  it('rejects an empty lastMessagePreview', () => {
    expect(() => ConversationEntity.create(sampleProps({ lastMessagePreview: '' }))).toThrow('lastMessagePreview must not be empty');
  });

  it('rejects a negative unreadCount', () => {
    expect(() => ConversationEntity.create(sampleProps({ unreadCount: -1 }))).toThrow('unreadCount must not be negative');
  });

  it('allows null relatedEntityType/relatedEntityId', () => {
    const conversation = ConversationEntity.create(sampleProps({ relatedEntityType: null, relatedEntityId: null }));

    expect(conversation.relatedEntityType).toBeNull();
    expect(conversation.relatedEntityId).toBeNull();
  });
});
