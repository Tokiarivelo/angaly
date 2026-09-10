import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Backs `POST /api/quotes/requests` (page `demande-sur-mesure`, 3-step form
 * submitted as one call — see docs/pages/demande-sur-mesure.md). No
 * `firstName`/`lastName`/`phone`/`email` fields: the endpoint requires an
 * authenticated CLIENT (see docs/features/quotes.md "Points d'attention"),
 * so contact details come from the caller's `Customer` profile, not this body.
 */
export class SurMesureRequestDto {
  @ApiProperty({ description: 'Type de vêtement souhaité (ex. "Robe de mariée")' })
  @IsString()
  @MinLength(1)
  garmentType!: string;

  @ApiProperty({ required: false, description: "Occasion/événement visé" })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiProperty({ required: false, description: "Date de l'événement (ISO 8601)" })
  @IsOptional()
  @IsISO8601()
  eventDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  budgetRange?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fabricPreference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false, type: [String], description: 'Ids `Media` déjà uploadés (jusqu\'à 5)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inspirationMediaIds?: string[];
}
