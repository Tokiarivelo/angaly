import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { IsUrl, IsNotEmpty } from 'class-validator';

class AnalyzeInspirationDto {
  @IsUrl()
  @IsNotEmpty()
  inspirationImageUrl!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('ai-inference/inspiration-analysis')
export class AiInspirationController {
  @Post()
  async analyze(@Body() dto: AnalyzeInspirationDto) {
    // Placeholder returning dummy features as per spec
    return {
      detectedInspirationFeatures: {
        note: 'Analyse factice de la photo - intégration à venir',
        url_analysed: dto.inspirationImageUrl,
      }
    };
  }
}
