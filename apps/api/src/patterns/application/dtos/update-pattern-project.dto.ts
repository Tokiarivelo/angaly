import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'ID du profil de mesures', example: 'meas-123' })
  @IsString()
  @IsOptional()
  measurementProfileId?: string;
}
