import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatternExportFormat, PATTERN_EXPORT_FORMATS } from '../../domain/value-objects/pattern-status.vo';

export class PatternPieceDto {
  @ApiProperty({ example: 'piece-1' })
  id!: string;

  @ApiProperty({ example: 'version-1' })
  versionId!: string;

  @ApiProperty({ example: 'Devant' })
  name!: string;

  @ApiProperty({ example: { outlineMm: [{ x: 0, y: 0 }] } })
  dimensionsJson!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Satin Duchesse' })
  fabricRecommendation!: string | null;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiPropertyOptional({ example: { angleDegrees: 90, originX: 100, originY: 200 } })
  grainlineJson!: unknown | null;

  @ApiPropertyOptional({ example: 1.0 })
  seamAllowanceCm!: number | null;

  @ApiPropertyOptional({ example: [] })
  notchesJson!: unknown | null;
}

export class PatternExportDto {
  @ApiProperty({ example: 'exp-1' })
  id!: string;

  @ApiProperty({ example: 'version-1' })
  versionId!: string;

  @ApiProperty({ enum: PATTERN_EXPORT_FORMATS, example: 'PDF_A4' })
  format!: PatternExportFormat;

  @ApiProperty({ example: 'media-1' })
  mediaId!: string;

  @ApiPropertyOptional({ example: 'http://localhost:9000/patterns/pat-1.pdf' })
  mediaUrl?: string | null;

  @ApiProperty({ example: '2026-09-12T12:00:00.000Z' })
  createdAt!: string;
}

export class PatternVersionDto {
  @ApiProperty({ example: 'ver-1' })
  id!: string;

  @ApiProperty({ example: 'proj-1' })
  projectId!: string;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiPropertyOptional({ example: 'Ajustement tour de taille' })
  changeLabel!: string | null;

  @ApiProperty({ example: { fit: 'slim' } })
  parametersJson!: Record<string, unknown>;

  @ApiProperty({ example: true })
  generatedByAI!: boolean;

  @ApiPropertyOptional({ example: 'user-couturiere-1' })
  reviewedById!: string | null;

  @ApiPropertyOptional({ example: 'Patron validé sans réserve' })
  reviewNote!: string | null;

  @ApiProperty({ example: '2026-09-12T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: [PatternPieceDto] })
  pieces!: PatternPieceDto[];

  @ApiPropertyOptional({ type: [PatternExportDto] })
  exports?: PatternExportDto[];
}
