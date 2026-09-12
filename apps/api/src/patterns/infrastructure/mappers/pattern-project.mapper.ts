import { PatternProjectEntity } from '../../domain/entities/pattern-project.entity';
import { PatternProjectResponseDto } from '../../application/dtos/pattern-project-response.dto';
import { PatternVersionMapper } from './pattern-version.mapper';
import { PatternStatus } from '../../domain/value-objects/pattern-status.vo';

export class PatternProjectMapper {
  static toEntity(record: any): PatternProjectEntity {
    return PatternProjectEntity.create({
      id: record.id,
      projectRef: record.projectRef,
      customerId: record.customerId,
      measurementProfileId: record.measurementProfileId ?? null,
      garmentType: record.garmentType,
      occasion: record.occasion ?? null,
      style: record.style ?? null,
      cutType: record.cutType ?? null,
      detailsJson: (record.detailsJson as Record<string, unknown>) ?? null,
      inspirationMediaId: record.inspirationMediaId ?? null,
      inspirationMediaUrl: record.inspirationMedia?.url ?? null,
      status: record.status as PatternStatus,
      createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
      versions: record.versions ? record.versions.map(PatternVersionMapper.toEntity) : undefined,
    });
  }

  static toDto(entity: PatternProjectEntity): PatternProjectResponseDto {
    const versionsDto = entity.versions ? entity.versions.map(PatternVersionMapper.toDto) : undefined;
    const currentVersion = entity.currentVersion ? PatternVersionMapper.toDto(entity.currentVersion) : null;

    return {
      id: entity.id,
      projectRef: entity.projectRef,
      customerId: entity.customerId,
      measurementProfileId: entity.measurementProfileId,
      garmentType: entity.garmentType,
      occasion: entity.occasion,
      style: entity.style,
      cutType: entity.cutType,
      detailsJson: entity.detailsJson,
      inspirationMediaId: entity.inspirationMediaId,
      inspirationMediaUrl: entity.inspirationMediaUrl,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      currentVersion,
      versions: versionsDto,
      versionsCount: entity.versions ? entity.versions.length : undefined,
    };
  }
}
