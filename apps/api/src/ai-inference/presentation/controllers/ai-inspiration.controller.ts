import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { IsUrl, IsNotEmpty } from 'class-validator';
import { SuggestPatternParametersUseCase } from '../../application/use-cases/suggest-pattern-parameters.use-case';

class AnalyzeInspirationDto {
  @IsUrl()
  @IsNotEmpty()
  inspirationImageUrl!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('ai-inference/inspiration-analysis')
export class AiInspirationController {
  constructor(private readonly suggestPatternParameters: SuggestPatternParametersUseCase) {}

  @Post()
  async analyze(@Body() dto: AnalyzeInspirationDto) {
    const { suggestion, isIndicativeOnly } = await this.suggestPatternParameters.execute({
      garmentType: 'AUTRE',
      occasion: null,
      style: null,
      measurements: {},
      inspirationImageUrl: dto.inspirationImageUrl,
    });

    return {
      suggestedCutType: suggestion.suggestedCutType,
      detectedInspirationFeatures: suggestion.detectedInspirationFeatures ?? {},
      confidence: suggestion.confidence,
      isIndicativeOnly,
    };
  }
}
