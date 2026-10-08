import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { InspirationAnalysisSnapshot, PatternExtParameters } from '@angaly/types';

export class UpdatePatternProjectDto {
  @ApiPropertyOptional({ description: 'Type de vêtement', example: 'ROBE' })
  @IsString()
  @IsOptional()
  garmentType?: string;

  @ApiPropertyOptional({ description: 'Occasion', example: 'Mariage' })
  @IsString()
  @IsOptional()
  occasion?: string;

  @ApiPropertyOptional({ description: 'Style', example: 'Sirène' })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiPropertyOptional({ description: 'Coupe', example: 'SIRENE' })
  @IsString()
  @IsOptional()
  cutType?: string;

  @ApiPropertyOptional({ description: 'Détails de personnalisation', example: { col: 'V' } })
  @IsOptional()
  detailsJson?: Record<string, string>;

  @ApiPropertyOptional({ description: 'ID du média d’inspiration photo', example: 'media-123' })
  @IsString()
  @IsOptional()
  inspirationMediaId?: string;

  @ApiPropertyOptional({ description: 'Analyse IA de la photo (observations + profil du vêtement)' })
  @IsOptional()
  @IsObject()
  inspirationAnalysisJson?: InspirationAnalysisSnapshot | null;

  @ApiPropertyOptional({
    description:
      'Paramètres étendus du moteur (ease AJUSTE|CONFORT|AMPLE, fullness.skirt 1–4, fullness.sleeve 1–2.5, ' +
      'lengths.skirtPct 40–130, sleevePct 0–100, bodicePct 80–120). Hors bornes = 400. null = défauts.',
    example: { ease: 'AMPLE', fullness: { skirt: 2 }, lengths: { skirtPct: 100 } },
  })
  @IsOptional()
  @IsObject()
  parametersExtJson?: PatternExtParameters | null;

  @ApiPropertyOptional({ description: 'ID du profil de mesures', example: 'meas-123' })
  @IsString()
  @IsOptional()
  measurementProfileId?: string;
}
