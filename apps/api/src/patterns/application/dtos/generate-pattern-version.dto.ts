import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AiProviderId } from '@angaly/types';

export class GeneratePatternVersionDto {
  @ApiPropertyOptional({
    description: 'Mesures manuelles ou personnalisées (ex: { TOUR_POITRINE: 90, ... })',
    example: { TOUR_POITRINE: 90, TOUR_TAILLE: 70, TOUR_BASSIN: 95 },
  })
  @IsOptional()
  measurements?: Record<string, number>;

  @ApiPropertyOptional({
    description:
      "Fournisseur d'IA choisi pour l'estimation des mesures manquantes (défaut : réglage de l'atelier). " +
      'La géométrie reste produite par le moteur déterministe.',
    enum: AiProviderId,
  })
  @IsOptional()
  @IsEnum(AiProviderId)
  aiProvider?: AiProviderId;
}
