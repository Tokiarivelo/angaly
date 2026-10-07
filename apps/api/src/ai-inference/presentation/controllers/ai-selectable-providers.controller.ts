import { Controller, Get, UseGuards } from '@nestjs/common';
import type { SelectableAiProvidersResponse } from '@angaly/types';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { ListSelectableAiProvidersUseCase } from '../../application/use-cases/list-selectable-ai-providers.use-case';

/** Any signed-in user: feeds the "modèle IA" picker of Pattern Studio (public facts only). */
@UseGuards(JwtAuthGuard)
@Controller('ai-inference/selectable-providers')
export class AiSelectableProvidersController {
  constructor(private readonly listSelectableProviders: ListSelectableAiProvidersUseCase) {}

  @Get()
  async list(): Promise<SelectableAiProvidersResponse> {
    return this.listSelectableProviders.execute();
  }
}
