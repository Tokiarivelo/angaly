import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { SendAssistantMessageUseCase } from '../../application/use-cases/send-assistant-message.use-case';
import { GetConversationHistoryUseCase } from '../../application/use-cases/get-conversation-history.use-case';
import { AssistantMessageDto } from '../../application/dtos/assistant-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai-inference/assistant')
export class AiAssistantController {
  constructor(
    private readonly sendAssistantMessage: SendAssistantMessageUseCase,
    private readonly getConversationHistory: GetConversationHistoryUseCase,
  ) {}

  @Post('messages')
  async sendMessage(@Request() req: any, @Body() dto: AssistantMessageDto) {
    // user ID mapping to customer ID should normally happen via a service.
    // Assuming req.user.customer.id exists or we pass userId for now.
    // Based on schema, AIConversation uses customerId. We mock or assume customerId here.
    const customerId = req.user.id; // Typically we would look up customer ID by user ID

    const message = await this.sendAssistantMessage.execute(
      customerId,
      dto.message,
      dto.patternProjectId,
    );

    return message;
  }

  @Get('conversations')
  async getHistory(@Request() req: any, @Query('patternProjectId') patternProjectId?: string) {
    const customerId = req.user.id;
    return this.getConversationHistory.execute(customerId, patternProjectId);
  }
}
