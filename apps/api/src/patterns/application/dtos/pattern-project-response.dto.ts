import type { InspirationAnalysisSnapshot, PatternExtParameters } from '@angaly/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatternStatus, PATTERN_STATUSES } from '../../domain/value-objects/pattern-status.vo';
import { PatternVersionDto } from './pattern-version-response.dto';

export class PatternProjectResponseDto {
  @ApiProperty({ example: 'proj-1' })
  id!: string;

  @ApiProperty({ example: 'ANG-PAT-2026-00001' })
  projectRef!: string;

  @ApiProperty({ example: 'cust-1' })
  customerId!: string;

  @ApiPropertyOptional({ example: 'meas-1' })
  measurementProfileId!: string | null;

  @ApiProperty({ example: 'ROBE' })
  garmentType!: string;

  @ApiPropertyOptional({ example: 'Mariage' })
  occasion!: string | null;

  @ApiPropertyOptional({ example: 'Classique' })
  style!: string | null;

  @ApiPropertyOptional({ example: 'SIRENE' })
  cutType!: string | null;

  @ApiPropertyOptional({ example: { encolure: 'V' } })
  detailsJson!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 'med-1' })
  inspirationMediaId!: string | null;

  @ApiPropertyOptional({ description: 'Analyse IA de la photo (observations + profil du vêtement)' })
  inspirationAnalysisJson?: InspirationAnalysisSnapshot | null;

  @ApiPropertyOptional({
    description: 'Paramètres étendus validés du moteur : aisance, ampleur, longueurs (null = défauts)',
    example: { ease: 'CONFORT', fullness: { skirt: 2 }, lengths: { skirtPct: 100 } },
  })
  parametersExtJson?: PatternExtParameters | null;

  @ApiPropertyOptional({ example: 'http://localhost:9000/patterns/insp.jpg' })
  inspirationMediaUrl?: string | null;

  @ApiProperty({ enum: PATTERN_STATUSES, example: 'DRAFT' })
  status!: PatternStatus;

  @ApiProperty({ example: '2026-09-12T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-09-12T12:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional({ type: () => PatternVersionDto })
  currentVersion?: PatternVersionDto | null;

  @ApiPropertyOptional({ type: () => [PatternVersionDto] })
  versions?: PatternVersionDto[];

  @ApiPropertyOptional({ example: 1 })
  versionsCount?: number;
}
