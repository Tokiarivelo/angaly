import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertAiProviderDto {
  @ApiProperty({
    description: 'Identifiant du modèle cible chez le fournisseur (ex: claude-sonnet-5-5, gemini-2.5-flash, gpt-4o)',
    example: 'claude-sonnet-5-5',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le modèle est requis' })
  model!: string;

  @ApiPropertyOptional({
    description: 'URL de base de l’API (requise pour Ollama / compatible OpenAI, optionnelle pour les autres)',
    example: 'https://api.groq.com/openai/v1',
  })
  @IsString()
  @IsOptional()
  baseUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Clé d’API du fournisseur (chiffrée au repos ; optionnelle lors d’une modification pour conserver la clé existante)',
    example: 'sk-ant-api03-••••••••••••••••••••',
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'Indique si le fournisseur est activé pour l’atelier',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
