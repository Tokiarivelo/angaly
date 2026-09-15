import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';
import { AiSuggestionRequestDto } from '../../application/dtos/ai-suggestion-request.dto';

/**
 * Exposes SuggestPatternParametersUseCase over HTTP so the wizard's Cut/Details
 * steps can pre-fill from an AI suggestion. The user always confirms before the
 * value is persisted on the project — a suggestion is never applied automatically
 * (spec §18/§20-24, docs/features/ai-inference.md).
 */
@UseGuards(JwtAuthGuard)
@Controller('ai-inference/pattern-suggestions')
export class AiPatternSuggestionsController {
  constructor(private readonly suggestPatternParameters: SuggestPatternParametersUseCase) {}

  @Post()
  async suggest(@Body() dto: AiSuggestionRequestDto) {
    return this.suggestPatternParameters.execute({
      garmentType: dto.garmentType,
      occasion: dto.occasion ?? null,
      style: dto.style ?? null,
      measurements: dto.measurements ?? {},
      inspirationImageUrl: dto.inspirationImageUrl ?? null,
    });
  }
}
