import { IsString, IsOptional, IsObject, IsUrl } from 'class-validator';

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
}
