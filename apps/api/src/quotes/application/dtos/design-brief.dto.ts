import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

/** Backs `POST /api/quotes/design-briefs` (page `personnalisation-creation`). */
export class DesignBriefDto {
  @ApiProperty({ description: 'Modèle de base personnalisé (Creation.id)' })
  @IsString()
  @MinLength(1)
  creationId!: string;

  @ApiProperty({ description: 'Options de personnalisation choisies (ex. { tissu: "soie", couleur: "ivoire" })' })
  @IsObject()
  options!: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, type: [String], description: "Ids `Media` déjà uploadés" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inspirationMediaIds?: string[];
}
