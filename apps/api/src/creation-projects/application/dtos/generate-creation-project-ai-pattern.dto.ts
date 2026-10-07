import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import type { CreationProjectGarmentType } from '@angaly/types';

export const VALID_GARMENT_TYPES: readonly CreationProjectGarmentType[] = [
  'ROBE',
  'JUPE',
  'PANTALON',
  'VESTE',
  'CHEMISE',
  'COSTUME',
  'ROBE_MARIEE',
  'AUTRE',
];

export class GenerateCreationProjectAiPatternDto {
  @ApiProperty({
    description: 'Type de vêtement pour le patron',
    enum: VALID_GARMENT_TYPES,
    example: 'ROBE_MARIEE',
  })
  @IsIn(VALID_GARMENT_TYPES, {
    message: `garmentType doit être l'un des suivants : ${VALID_GARMENT_TYPES.join(', ')}`,
  })
  garmentType!: CreationProjectGarmentType;


  @ApiPropertyOptional({
    description: 'Coupe souhaitée (ex: DROITE, EVASEE, SIRENE, TRAPEZE)',
    example: 'SIRENE',
  })
  @IsOptional()
  @IsString()
  cutType?: string;

  @ApiPropertyOptional({
    description: 'Style ou occasion (ex: Cérémonie Haute Couture, Soirée)',
    example: 'Cérémonie Haute Couture',
  })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({
    description: 'Détails de coupe (encolure, manches, longueur)',
    example: { encolure: 'bateau', manches: 'trois-quarts' },
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Mesures réelles ou personnalisées en cm (ex: TOUR_POITRINE: 88, TOUR_TAILLE: 68...)',
    example: { TOUR_POITRINE: 88, TOUR_TAILLE: 68, TOUR_BASSIN: 94, LONGUEUR_DOS: 40 },
  })
  @IsOptional()
  @IsObject()
  measurements?: Record<string, number>;

  @ApiPropertyOptional({
    description: "Solliciter d'abord l'inférence IA pour suggérer coupe et finitions optimales",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requestAiSuggestion?: boolean;

  @ApiPropertyOptional({
    description: "Sauvegarder le tracé vectoriel SVG généré dans les Médias de l'étape Patron",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  saveMedia?: boolean;

  @ApiPropertyOptional({
    description: "Ajouter une note d'atelier documentant le patron IA généré",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  addNote?: boolean;
}
