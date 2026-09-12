import { PatternVersionEntity } from '../../domain/entities/pattern-version.entity';
import { PatternPieceEntity } from '../../domain/entities/pattern-piece.entity';
import { PatternExportEntity } from '../../domain/entities/pattern-export.entity';
import {
  PatternVersionDto,
  PatternPieceDto,
  PatternExportDto,
} from '../../application/dtos/pattern-version-response.dto';
import { PatternExportFormat } from '../../domain/value-objects/pattern-status.vo';

export class PatternVersionMapper {
  static toPieceEntity(record: any): PatternPieceEntity {
    return PatternPieceEntity.create({
      id: record.id,
      versionId: record.versionId,
      name: record.name,
      dimensionsJson: (record.dimensionsJson as Record<string, unknown>) ?? {},
      fabricRecommendation: record.fabricRecommendation ?? null,
      quantity: record.quantity ?? 1,
      grainlineJson: (record.grainlineJson as Record<string, unknown>) ?? null,
      seamAllowanceCm: record.seamAllowanceCm ?? null,
      notchesJson: (record.notchesJson as Record<string, unknown>) ?? null,
    });
  }

  static toExportEntity(record: any): PatternExportEntity {
    return PatternExportEntity.create({
      id: record.id,
      versionId: record.versionId,
      format: record.format as PatternExportFormat,
      mediaId: record.mediaId,
      mediaUrl: record.media?.url ?? null,
      createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
    });
  }

  static toEntity(record: any): PatternVersionEntity {
    return PatternVersionEntity.create({
      id: record.id,
      projectId: record.projectId,
      versionNumber: record.versionNumber,
      changeLabel: record.changeLabel ?? null,
      parametersJson: (record.parametersJson as Record<string, unknown>) ?? {},
      generatedByAI: Boolean(record.generatedByAI),
      reviewedById: record.reviewedById ?? null,
      reviewNote: record.reviewNote ?? null,
      createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
      pieces: record.pieces ? record.pieces.map(PatternVersionMapper.toPieceEntity) : [],
      exports: record.exports ? record.exports.map(PatternVersionMapper.toExportEntity) : [],
    });
  }

  static toPieceDto(entity: PatternPieceEntity): PatternPieceDto {
    return {
      id: entity.id,
      versionId: entity.versionId,
      name: entity.name,
      dimensionsJson: entity.dimensionsJson,
      fabricRecommendation: entity.fabricRecommendation,
      quantity: entity.quantity,
      grainlineJson: entity.grainlineJson,
      seamAllowanceCm: entity.seamAllowanceCm,
      notchesJson: entity.notchesJson,
    };
  }

  static toExportDto(entity: PatternExportEntity): PatternExportDto {
    return {
      id: entity.id,
      versionId: entity.versionId,
      format: entity.format,
      mediaId: entity.mediaId,
      mediaUrl: entity.mediaUrl,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static toDto(entity: PatternVersionEntity): PatternVersionDto {
    return {
      id: entity.id,
      projectId: entity.projectId,
      versionNumber: entity.versionNumber,
      changeLabel: entity.changeLabel,
      parametersJson: entity.parametersJson,
      generatedByAI: entity.generatedByAI,
      reviewedById: entity.reviewedById,
      reviewNote: entity.reviewNote,
      createdAt: entity.createdAt.toISOString(),
      pieces: (entity.pieces ?? []).map(PatternVersionMapper.toPieceDto),
      exports: entity.exports ? entity.exports.map(PatternVersionMapper.toExportDto) : undefined,
    };
  }
}
