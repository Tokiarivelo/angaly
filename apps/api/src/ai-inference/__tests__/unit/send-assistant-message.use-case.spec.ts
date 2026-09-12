import { Test, TestingModule } from '@nestjs/testing';
import { SendAssistantMessageUseCase } from '../../application/use-cases/send-assistant-message.use-case';
import { AI_CONVERSATION_REPOSITORY } from '../../domain/repositories/ai-conversation.repository';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';
import { AIConversationMessage } from '../../domain/entities/ai-conversation-message.entity';

describe('SendAssistantMessageUseCase', () => {
  let useCase: SendAssistantMessageUseCase;
  let repo: any;
  let aiClient: any;

  beforeEach(async () => {
    repo = {
      createMessage: jest.fn().mockImplementation((role, msg, custId, projId) => {
        return new AIConversationMessage('id', role, msg, new Date(), custId, projId);
      }),
    };

    aiClient = {
      sendMessageToAssistant: jest.fn().mockResolvedValue('Hello from AI'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAssistantMessageUseCase,
        { provide: AI_CONVERSATION_REPOSITORY, useValue: repo },
        { provide: AiServiceHttpClient, useValue: aiClient },
      ],
    }).compile();

    useCase = module.get<SendAssistantMessageUseCase>(SendAssistantMessageUseCase);
  });

  it('should persist user message and assistant message', async () => {
    const result = await useCase.execute('cust-123', 'Hi there', 'proj-456');

    expect(repo.createMessage).toHaveBeenCalledWith('USER', 'Hi there', 'cust-123', 'proj-456');
    expect(aiClient.sendMessageToAssistant).toHaveBeenCalledWith('Hi there');
    expect(repo.createMessage).toHaveBeenCalledWith('ASSISTANT', 'Hello from AI', 'cust-123', 'proj-456');
    expect(result.message).toBe('Hello from AI');
  });
});
