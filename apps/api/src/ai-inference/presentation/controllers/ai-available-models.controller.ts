import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@angaly/types';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AiServiceHttpClient } from '../../infrastructure/services/ai-service-http-client';

/**
 * ADMIN-only: tells the admin settings screen which model backends
 * apps/ai-service actually has loaded right now (e.g. whether the trained
 * local model's artifact is present), so it can grey out an unusable choice
 * instead of silently falling back. See docs/features/ai-model-settings.md.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('ai-inference/available-models')
export class AiAvailableModelsController {
  constructor(private readonly aiClient: AiServiceHttpClient) {}

  @Get()
  async get() {
    return this.aiClient.getAvailableModels();
  }
}
