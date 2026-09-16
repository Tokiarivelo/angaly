import { MessageEntity } from '../../domain/entities/message.entity';

function sampleProps(overrides: Partial<Parameters<typeof MessageEntity.create>[0]> = {}) {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderRole: 'CLIENT' as const,
    senderUserId: 'user-1',
    content: 'Bonjour, où en est ma commande ?',
    isRead: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('MessageEntity', () => {
  it('creates a valid message', () => {
    const message = MessageEntity.create(sampleProps());

    expect(message.id).toBe('msg-1');
    expect(message.senderRole).toBe('CLIENT');
    expect(message.isRead).toBe(true);
  });

  it('rejects an empty conversationId', () => {
    expect(() => MessageEntity.create(sampleProps({ conversationId: '  ' }))).toThrow('conversationId must not be empty');
  });

  it('rejects an unrecognized senderRole', () => {
    expect(() =>
      // @ts-expect-error deliberately invalid for the test
      MessageEntity.create(sampleProps({ senderRole: 'NOT_A_ROLE' })),
    ).toThrow('senderRole must be one of');
  });

  it('rejects an empty senderUserId', () => {
    expect(() => MessageEntity.create(sampleProps({ senderUserId: '' }))).toThrow('senderUserId must not be empty');
  });

  it('rejects an empty content', () => {
    expect(() => MessageEntity.create(sampleProps({ content: '   ' }))).toThrow('content must not be empty');
  });

  it('markAsRead() flips isRead to true', () => {
    const message = MessageEntity.create(sampleProps({ isRead: false }));

    message.markAsRead();

    expect(message.isRead).toBe(true);
  });
});
