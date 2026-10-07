import { IsString, IsOptional, IsObject, IsUrl, IsEnum } from 'class-validator';
import { AiProviderId } from '@angaly/types';

export class AiSuggestionRequestDto {
  @IsString()
  garmentType!: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsObject()
  measurements!: Record<string, number>;

  @IsOptional()
  @IsUrl()
  inspirationImageUrl?: string;

  /** Fournisseur choisi dans Pattern Studio ; absent = réglage par défaut de l'atelier. */
  @IsOptional()
  @IsEnum(AiProviderId)
  aiProvider?: AiProviderId;
}
