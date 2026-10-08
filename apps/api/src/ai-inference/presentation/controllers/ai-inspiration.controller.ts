import { Controller, Logger, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { IsEnum, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { AiProviderId, AiUsage, type GarmentProfile } from '@angaly/types';
import { AiProviderResolverService } from '../../application/services/ai-provider-resolver.service';
import { AnalyzeInspirationImageUseCase } from '../../application/use-cases/analyze-inspiration-image.use-case';

class AnalyzeInspirationDto {
  // require_tld:false — local MinIO URLs (http://localhost:9000/…) are valid in development.
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  @IsNotEmpty()
  inspirationImageUrl!: string;

  /** Model picked in the wizard; absent = the atelier's routing from the AI settings. */
  @IsOptional()
  @IsEnum(AiProviderId)
  aiProvider?: AiProviderId;
}

@UseGuards(JwtAuthGuard)
@Controller('ai-inference/inspiration-analysis')
export class AiInspirationController {
  private readonly logger = new Logger(AiInspirationController.name);

  constructor(
    private readonly analyzeInspirationImage: AnalyzeInspirationImageUseCase,
    private readonly providerResolver: AiProviderResolverService,
  ) {}

  /**
   * Reads one photo and returns the descriptive features plus a wizard-ready `profile`
   * (garment type, occasion, style, cut, details). `profile.isGarment === false` means the
   * photo is not a garment and the wizard must not pre-fill anything.
   */
  @Post()
  async analyze(@Body() dto: AnalyzeInspirationDto) {
    const startedAt = Date.now();
    this.logger.log(
      `POST inspiration-analysis url=${dto.inspirationImageUrl} chosenModel=${dto.aiProvider ?? 'settings'}`,
    );
    try {
      const provider = await this.providerResolver.resolveSelected(
        dto.aiProvider,
        AiUsage.PATTERN_SUGGESTION,
      );
      if (dto.aiProvider && !provider) {
        this.logger.warn(
          `Chosen model ${dto.aiProvider} is not usable (disabled/not configured) — using the atelier settings instead`,
        );
      }
      const analysis = await this.analyzeInspirationImage.execute(
        dto.inspirationImageUrl,
        provider,
      );
      this.logger.log(
        `inspiration-analysis done in ${Date.now() - startedAt}ms model=${analysis.modelVersion} confidence=${analysis.confidence} garment=${analysis.profile?.isGarment ?? 'n/a'}`,
      );
      const profile: GarmentProfile | null = analysis.profile ?? null;
      return {
        suggestedCutType: analysis.suggestedCutType,
        detectedInspirationFeatures: analysis.features,
        profile,
        confidence: analysis.confidence,
        isIndicativeOnly:
          analysis.confidence < 0.5 ||
          analysis.modelVersion.startsWith('fallback') ||
          analysis.modelVersion.includes('placeholder'),
      };
    } catch (error) {
      // An unreadable photo must never block the wizard: the customer just fills it in by hand.
      this.logger.warn(
        `Inspiration analysis failed after ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        suggestedCutType: null,
        detectedInspirationFeatures: {},
        profile: null,
        confidence: 0,
        isIndicativeOnly: true,
      };
    }
  }
}
