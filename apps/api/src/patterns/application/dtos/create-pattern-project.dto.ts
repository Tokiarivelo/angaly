import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePatternProjectDto {
  @ApiProperty({ description: 'Type de vêtement (ex: ROBE, JUPE, etc.)', example: 'ROBE' })
  @IsString()
  @IsNotEmpty()
  garmentType!: string;

  @ApiPropertyOptional({ description: 'Nom du projet (optionnel)', example: 'Robe de soirée' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Occasion pour la création', example: 'Mariage' })
  @IsString()
  @IsOptional()
  occasion?: string;

  @ApiPropertyOptional({ description: 'Style vestimentaire', example: 'Minimaliste chic' })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiPropertyOptional({ description: 'Type de coupe', example: 'SIRENE' })
  @IsString()
  @IsOptional()
  cutType?: string;

  @ApiPropertyOptional({ description: 'Détails de personnalisation (col, manches...)', example: { encolure: 'V' } })
  @IsOptional()
  detailsJson?: Record<string, string>;

  @ApiPropertyOptional({ description: 'ID du profil de mesures à associer', example: 'cm123456789' })
  @IsString()
  @IsOptional()
  measurementProfileId?: string;
}
