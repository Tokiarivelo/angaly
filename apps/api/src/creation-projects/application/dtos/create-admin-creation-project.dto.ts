import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreationProjectStage } from '@angaly/types';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateInlineCustomerDto {
  @ApiProperty({ description: 'Prénom de la cliente', example: 'Hanitra' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Nom de la cliente', example: 'Rakoto' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'Adresse email de la cliente', example: 'hanitra.rakoto@example.mg' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone de la cliente', example: '+261 34 00 123 45' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateAdminCreationProjectDto {
  @ApiProperty({ description: 'Titre du projet de création', example: 'Robe de mariée — Mme Rakoto' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'ID de la cliente existante (si déjà enregistrée)' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Informations pour créer une nouvelle cliente en ligne' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInlineCustomerDto)
  newCustomer?: CreateInlineCustomerDto;

  @ApiPropertyOptional({ description: 'Type de vêtement sélectionné', example: 'Robe de mariée' })
  @IsOptional()
  @IsString()
  garmentType?: string;

  @ApiPropertyOptional({ description: 'Type d’événement', example: 'Mariage' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ description: 'Date de l’événement (ISO ou string)', example: '2026-12-14' })
  @IsOptional()
  @IsString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Fourchette budgétaire indicative', example: '1 000 000–2 000 000 Ar' })
  @IsOptional()
  @IsString()
  budgetRange?: string;

  @ApiPropertyOptional({ description: 'Description et notes de consultation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Étape initiale du projet',
    enum: CreationProjectStage,
    default: CreationProjectStage.CONSULTATION,
  })
  @IsOptional()
  @IsEnum(CreationProjectStage)
  initialStage?: CreationProjectStage;

  @ApiPropertyOptional({ description: 'ID du devis associé (facultatif)' })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional({ description: 'ID du membre du staff assigné (ou null)' })
  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @ApiPropertyOptional({ description: 'URLs ou identifiants des photos d’inspiration', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  inspirationMediaUrls?: string[];
}
