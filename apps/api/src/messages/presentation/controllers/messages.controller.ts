import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { ConversationResponseDto } from '../../application/dtos/conversation-response.dto';
import { MessageResponseDto } from '../../application/dtos/message-response.dto';
import { SendMessageRequestDto } from '../../application/dtos/send-message-request.dto';
import { StartConversationRequestDto } from '../../application/dtos/start-conversation-request.dto';
import { GetConversationThreadUseCase } from '../../application/use-cases/get-conversation-thread.use-case';
import { ListMyConversationsUseCase } from '../../application/use-cases/list-my-conversations.use-case';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';
import { ConversationMapper } from '../../infrastructure/mappers/conversation.mapper';
import { MessageMapper } from '../../infrastructure/mappers/message.mapper';

/**
 * All routes require an authenticated user. `CLIENT` sees/replies to their
 * own conversations; `COUTURIERE`/`MANAGER`/`ADMIN` see and reply to every
 * conversation (no assignment system, no staff-facing UI in this phase — see
 * docs/features/messages.md).
 */
@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(
    private readonly listMyConversationsUseCase: ListMyConversationsUseCase,
    private readonly getConversationThreadUseCase: GetConversationThreadUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly startConversationUseCase: StartConversationUseCase,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations — own conversations for CLIENT, every conversation for staff' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  async listConversations(@CurrentUser() user: AccessTokenPayload): Promise<ConversationResponseDto[]> {
    const conversations = await this.listMyConversationsUseCase.execute(user.sub, user.role);
    return conversations.map((conversation) => ConversationMapper.toResponseDto(conversation));
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get a conversation thread (owner-only for CLIENT); marks unread staff messages as read for the owning CLIENT' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  async getThread(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<MessageResponseDto[]> {
    const messages = await this.getConversationThreadUseCase.execute(id, user.sub, user.role);
    return messages.map((message) => MessageMapper.toResponseDto(message));
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Append a message to an existing conversation (owner CLIENT, or staff)' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() payload: SendMessageRequestDto,
  ): Promise<MessageResponseDto> {
    const message = await this.sendMessageUseCase.execute({
      conversationId: id,
      senderUserId: user.sub,
      role: user.role,
      content: payload.content,
    });
    return MessageMapper.toResponseDto(message);
  }

  @Post('conversations')
  @UseGuards(RolesGuard)
  @Roles('COUTURIERE', 'MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Staff: start a new conversation with a customer (find-or-create by customer+atelier) and send its first message' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async startConversation(
    @CurrentUser() user: AccessTokenPayload,
    @Body() payload: StartConversationRequestDto,
  ): Promise<MessageResponseDto> {
    const message = await this.startConversationUseCase.execute({
      senderUserId: user.sub,
      role: user.role,
      customerId: payload.customerId,
      atelierId: payload.atelierId,
      content: payload.content,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
    });
    return MessageMapper.toResponseDto(message);
  }
}
