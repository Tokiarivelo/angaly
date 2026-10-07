import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { AiProviderId } from '@angaly/types';

export class UpdateAiRoutingDto {
  @ApiPropertyOptional({
    description: 'Fournisseur d’IA assigné à l’estimation des mesures manquantes',
    enum: AiProviderId,
    example: AiProviderId.ANTHROPIC,
  })
  @IsEnum(AiProviderId, { message: 'Fournisseur d’estimation de mesures invalide' })
  @IsOptional()
  measurementProvider?: AiProviderId;

  @ApiPropertyOptional({
    description: 'Fournisseur d’IA assigné à la suggestion de coupe et détails',
    enum: AiProviderId,
    example: AiProviderId.GEMINI,
  })
  @IsEnum(AiProviderId, { message: 'Fournisseur de suggestion de coupe invalide' })
  @IsOptional()
  patternSuggestionProvider?: AiProviderId;

  @ApiPropertyOptional({
    description: 'Rétro-compatibilité : choix historique du modèle d’estimation de mesures (GEMINI | LOCAL_STATISTICAL)',
    enum: ['GEMINI', 'LOCAL_STATISTICAL'],
    example: 'GEMINI',
  })
  @IsIn(['GEMINI', 'LOCAL_STATISTICAL'], { message: 'Modèle invalide' })
  @IsOptional()
  measurementModel?: 'GEMINI' | 'LOCAL_STATISTICAL';
}
