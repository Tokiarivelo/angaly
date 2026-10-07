import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerLookupResponseDto {
  @ApiProperty({ description: 'ID de la cliente' })
  id!: string;

  @ApiProperty({ description: 'Prénom' })
  firstName!: string;

  @ApiProperty({ description: 'Nom' })
  lastName!: string;

  @ApiProperty({ description: 'Email de connexion' })
  email!: string;

  @ApiPropertyOptional({ description: 'Téléphone' })
  phone!: string | null;
}

export class QuoteLookupResponseDto {
  @ApiProperty({ description: 'ID du devis' })
  id!: string;

  @ApiProperty({ description: 'Numéro public du devis', example: 'ANG-DEV-2026-0042' })
  quoteNumber!: string;

  @ApiProperty({ description: 'Montant total' })
  total!: string;

  @ApiPropertyOptional({ description: 'Nom de la cliente associée' })
  customerName?: string | null;
}
