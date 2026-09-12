import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GeneratePatternVersionDto {
  @ApiPropertyOptional({
    description: 'Mesures manuelles ou personnalisées (ex: { TOUR_POITRINE: 90, ... })',
    example: { TOUR_POITRINE: 90, TOUR_TAILLE: 70, TOUR_BASSIN: 95 },
  })
  @IsOptional()
  measurements?: Record<string, number>;
}
