import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AiProviderBillingTier,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
  AiProviderId,
  AiProviderStatus,
  type AiRoutingSetting,
  type TestAiProviderResponse,
} from '@angaly/types';

export class AiProviderCatalogEntryDto implements AiProviderCatalogEntry {
  @ApiProperty({ enum: AiProviderId, example: AiProviderId.ANTHROPIC })
  id!: AiProviderId;

  @ApiProperty({ example: 'Claude (Anthropic)' })
  name!: string;

  @ApiProperty({ enum: AiProviderBillingTier, example: AiProviderBillingTier.PAID })
  tier!: AiProviderBillingTier;

  @ApiProperty({ example: 'Payant' })
  tierLabel!: string;

  @ApiProperty({ example: 'Modèles de pointe pour la déduction morphologique et le raisonnement de coupe.' })
  description!: string;

  @ApiProperty({ example: 'AN' })
  monogram!: string;

  @ApiProperty({ example: true })
  requiresApiKey!: boolean;

  @ApiProperty({ example: false })
  requiresBaseUrl!: boolean;

  @ApiPropertyOptional({ example: 'https://api.mistral.ai/v1' })
  defaultBaseUrl?: string;

  @ApiProperty({ example: 'claude-sonnet-5-5' })
  defaultModel!: string;

  @ApiProperty({ type: [String], example: ['claude-sonnet-5-5', 'claude-haiku-4-5-20251001'] })
  suggestedModels!: string[];

  @ApiPropertyOptional({ example: false })
  isSelfHosted?: boolean;
}

export class AiProviderConfigViewDto implements AiProviderConfigView {
  @ApiProperty({ enum: AiProviderId, example: AiProviderId.ANTHROPIC })
  provider!: AiProviderId;

  @ApiProperty({ example: 'claude-sonnet-5-5' })
  model!: string;

  @ApiProperty({ nullable: true, example: null })
  baseUrl!: string | null;

  @ApiProperty({ nullable: true, example: '••••••••3f9a' })
  apiKeyMasked!: string | null;

  @ApiProperty({ enum: AiProviderStatus, example: AiProviderStatus.OK })
  status!: AiProviderStatus;

  @ApiProperty({ nullable: true, example: '2026-10-02T12:00:00.000Z' })
  lastTestedAt!: string | null;

  @ApiProperty({ nullable: true, example: 920 })
  lastLatencyMs!: number | null;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: '2026-10-02T12:00:00.000Z' })
  updatedAt!: string;
}

export class AiProvidersListResponseDto {
  @ApiProperty({ type: [AiProviderCatalogEntryDto] })
  catalog!: AiProviderCatalogEntryDto[];

  @ApiProperty({ type: [AiProviderConfigViewDto] })
  configured!: AiProviderConfigViewDto[];
}

export class AiRoutingSettingResponseDto implements AiRoutingSetting {
  @ApiProperty({ enum: AiProviderId, example: AiProviderId.ANTHROPIC })
  measurementProvider!: AiProviderId;

  @ApiProperty({ enum: AiProviderId, example: AiProviderId.GEMINI })
  patternSuggestionProvider!: AiProviderId;

  @ApiProperty({ enum: AiProviderId, isArray: true, example: [AiProviderId.ANTHROPIC] })
  patternSuggestionFallbacks!: AiProviderId[];

  @ApiProperty({ example: '2026-10-02T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ nullable: true, example: 'usr_admin123' })
  updatedById!: string | null;

  @ApiPropertyOptional({ example: 'GEMINI' })
  measurementModel?: 'GEMINI' | 'LOCAL_STATISTICAL';
}

export class TestAiProviderResponseDto implements TestAiProviderResponse {
  @ApiProperty({ enum: AiProviderId, example: AiProviderId.ANTHROPIC })
  provider!: AiProviderId;

  @ApiProperty({ enum: AiProviderStatus, example: AiProviderStatus.OK })
  status!: AiProviderStatus;

  @ApiProperty({ example: 850 })
  latencyMs!: number;

  @ApiProperty({ example: '2026-10-02T12:00:00.000Z' })
  testedAt!: string;

  @ApiPropertyOptional({ example: 'Connexion réussie (latence optimale)' })
  message?: string;
}
