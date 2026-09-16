import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ConversationEntity } from '../../domain/entities/conversation.entity';
import { MessageEntity } from '../../domain/entities/message.entity';
import { GetConversationThreadUseCase } from '../../application/use-cases/get-conversation-thread.use-case';
import { ListMyConversationsUseCase } from '../../application/use-cases/list-my-conversations.use-case';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';
import { MessagesController } from '../../presentation/controllers/messages.controller';

function sampleConversation(): ConversationEntity {
  return ConversationEntity.create({
    id: 'conv-1',
    customerId: 'customer-1',
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

function sampleMessage(overrides: Partial<{ senderRole: 'CLIENT' | 'STAFF' }> = {}): MessageEntity {
  return MessageEntity.create({
    id: 'msg-1',
    conversationId: 'conv-1',
    senderRole: overrides.senderRole ?? 'CLIENT',
    senderUserId: 'user-1',
    content: 'Bonjour, où en est ma commande ?',
    isRead: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('MessagesController (integration)', () => {
  let app: INestApplication;
  const listMyConversationsUseCase = { execute: jest.fn() };
  const getConversationThreadUseCase = { execute: jest.fn() };
  const sendMessageUseCase = { execute: jest.fn() };
  const startConversationUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: ListMyConversationsUseCase, useValue: listMyConversationsUseCase },
        { provide: GetConversationThreadUseCase, useValue: getConversationThreadUseCase },
        { provide: SendMessageUseCase, useValue: sendMessageUseCase },
        { provide: StartConversationUseCase, useValue: startConversationUseCase },
        JwtAuthGuard,
        RolesGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  function bearerFor(role: 'CLIENT' | 'COUTURIERE' | 'MANAGER' | 'ADMIN' = 'CLIENT', sub = 'user-1'): [string, string] {
    accessTokenService.verify.mockReturnValue({ sub, role });
    return ['Authorization', 'Bearer valid-token'];
  }

  describe('GET /messages/conversations', () => {
    it('rejects without a bearer token (401)', async () => {
      await request(server()).get('/messages/conversations').expect(401);
    });

    it("returns the caller's conversations (200)", async () => {
      listMyConversationsUseCase.execute.mockResolvedValue([sampleConversation()]);

      const [header, value] = bearerFor();
      const response = await request(server()).get('/messages/conversations').set(header, value).expect(200);

      expect(response.body).toHaveLength(1);
      expect((response.body as { atelierName: string }[])[0].atelierName).toBe('Atelier Antananarivo');
      expect(listMyConversationsUseCase.execute).toHaveBeenCalledWith('user-1', 'CLIENT');
    });
  });

  describe('GET /messages/conversations/:id/messages', () => {
    it('returns the thread (200)', async () => {
      getConversationThreadUseCase.execute.mockResolvedValue([sampleMessage()]);

      const [header, value] = bearerFor();
      const response = await request(server()).get('/messages/conversations/conv-1/messages').set(header, value).expect(200);

      expect(response.body).toHaveLength(1);
      expect(getConversationThreadUseCase.execute).toHaveBeenCalledWith('conv-1', 'user-1', 'CLIENT');
    });

    it("returns 403 for another customer's conversation", async () => {
      getConversationThreadUseCase.execute.mockRejectedValue(new ForbiddenException('This conversation does not belong to the current user'));

      const [header, value] = bearerFor();
      await request(server()).get('/messages/conversations/conv-1/messages').set(header, value).expect(403);
    });

    it('returns 404 for an unknown conversation', async () => {
      getConversationThreadUseCase.execute.mockRejectedValue(new NotFoundException('Conversation missing not found'));

      const [header, value] = bearerFor();
      await request(server()).get('/messages/conversations/missing/messages').set(header, value).expect(404);
    });
  });

  describe('POST /messages/conversations/:id/messages', () => {
    it('appends a message for the owning CLIENT (201)', async () => {
      sendMessageUseCase.execute.mockResolvedValue(sampleMessage());

      const [header, value] = bearerFor();
      const response = await request(server())
        .post('/messages/conversations/conv-1/messages')
        .set(header, value)
        .send({ content: 'Bonjour, où en est ma commande ?' })
        .expect(201);

      expect((response.body as { content: string }).content).toBe('Bonjour, où en est ma commande ?');
      expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        senderUserId: 'user-1',
        role: 'CLIENT',
        content: 'Bonjour, où en est ma commande ?',
      });
    });

    it('allows a STAFF caller to reply (201)', async () => {
      sendMessageUseCase.execute.mockResolvedValue(sampleMessage({ senderRole: 'STAFF' }));

      const [header, value] = bearerFor('COUTURIERE', 'staff-user');
      await request(server()).post('/messages/conversations/conv-1/messages').set(header, value).send({ content: 'Votre commande avance bien.' }).expect(201);

      expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        senderUserId: 'staff-user',
        role: 'COUTURIERE',
        content: 'Votre commande avance bien.',
      });
    });

    it('rejects an empty content (400)', async () => {
      const [header, value] = bearerFor();
      await request(server()).post('/messages/conversations/conv-1/messages').set(header, value).send({ content: '' }).expect(400);
      expect(sendMessageUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 403 when a CLIENT sends into another customer’s conversation', async () => {
      sendMessageUseCase.execute.mockRejectedValue(new ForbiddenException('This conversation does not belong to the current user'));

      const [header, value] = bearerFor();
      await request(server()).post('/messages/conversations/conv-1/messages').set(header, value).send({ content: 'Bonjour' }).expect(403);
    });
  });

  describe('POST /messages/conversations', () => {
    it('rejects a CLIENT caller (403)', async () => {
      const [header, value] = bearerFor('CLIENT');
      await request(server())
        .post('/messages/conversations')
        .set(header, value)
        .send({ customerId: 'customer-1', atelierId: 'atelier-1', content: 'Bonjour' })
        .expect(403);
      expect(startConversationUseCase.execute).not.toHaveBeenCalled();
    });

    it('allows a COUTURIERE caller to start a new conversation (201)', async () => {
      startConversationUseCase.execute.mockResolvedValue(sampleMessage({ senderRole: 'STAFF' }));

      const [header, value] = bearerFor('COUTURIERE', 'staff-user');
      const response = await request(server())
        .post('/messages/conversations')
        .set(header, value)
        .send({ customerId: 'customer-1', atelierId: 'atelier-1', content: 'Bonjour, votre commande est prête.', relatedEntityType: 'Order', relatedEntityId: 'order-1' })
        .expect(201);

      expect((response.body as { id: string }).id).toBe('msg-1');
      expect(startConversationUseCase.execute).toHaveBeenCalledWith({
        senderUserId: 'staff-user',
        role: 'COUTURIERE',
        customerId: 'customer-1',
        atelierId: 'atelier-1',
        content: 'Bonjour, votre commande est prête.',
        relatedEntityType: 'Order',
        relatedEntityId: 'order-1',
      });
    });

    it('allows MANAGER and ADMIN callers too (201)', async () => {
      startConversationUseCase.execute.mockResolvedValue(sampleMessage({ senderRole: 'STAFF' }));

      const [header, value] = bearerFor('ADMIN', 'staff-user');
      await request(server()).post('/messages/conversations').set(header, value).send({ customerId: 'customer-1', atelierId: 'atelier-1', content: 'Bonjour' }).expect(201);
    });
  });
});
