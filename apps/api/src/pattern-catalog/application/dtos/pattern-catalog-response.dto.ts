import { ApiProperty } from '@nestjs/swagger';

export class CatalogCreditDto {
  @ApiProperty() title!: string;
  @ApiProperty() date!: string;
  @ApiProperty() source!: string;
  @ApiProperty() page!: string;
  @ApiProperty() license!: string;
}

export class CatalogPieceDto {
  @ApiProperty() name!: string;
  @ApiProperty() quantity!: number;
}

export class PatternCatalogEntryDto {
  @ApiProperty({ example: 'tournure-1885' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() era!: string;
  @ApiProperty() notes!: string;
  @ApiProperty({ enum: ['MODERNE', 'HISTORIQUE', 'MARIEE'] }) group!: string;
  @ApiProperty() garmentType!: string;
  @ApiProperty() pieceCount!: number;
  @ApiProperty({ nullable: true, type: Number }) yardageM!: number | null;
  @ApiProperty({ type: [CatalogPieceDto] }) pieces!: CatalogPieceDto[];
  @ApiProperty({ nullable: true, type: String }) imageUrl!: string | null;
  @ApiProperty({ nullable: true, type: CatalogCreditDto }) credit!: CatalogCreditDto | null;
}

export class CreatedFromCatalogDto {
  @ApiProperty() projectId!: string;
}
