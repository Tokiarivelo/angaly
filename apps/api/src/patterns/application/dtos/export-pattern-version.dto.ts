import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PatternExportFormat, PATTERN_EXPORT_FORMATS } from '../../domain/value-objects/pattern-status.vo';

export class ExportPatternVersionDto {
  @ApiProperty({
    description: 'Format de fichier pour l’export du patron',
    enum: PATTERN_EXPORT_FORMATS,
    example: 'PDF_A4',
  })
  @IsEnum(PATTERN_EXPORT_FORMATS)
  @IsNotEmpty()
  format!: PatternExportFormat;
}
