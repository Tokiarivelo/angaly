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
  // require_tld:false — local MinIO URLs (http://localhost:9000/…) are valid in development.
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  inspirationImageUrl?: string;

  /** Fournisseur choisi dans Pattern Studio ; absent = réglage par défaut de l'atelier. */
  @IsOptional()
  @IsEnum(AiProviderId)
  aiProvider?: AiProviderId;
}
