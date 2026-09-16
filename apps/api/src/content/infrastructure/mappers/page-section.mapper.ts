import type { PageSection as PrismaPageSection, PageSectionVersion as PrismaPageSectionVersion } from '@angaly/database';
import type { ContentStatus as SharedContentStatus, Locale as SharedLocale } from '@angaly/types';

import { PageSectionVersionResponseDto } from '../../application/dtos/page-section-version-response.dto';
import { PageSectionResponseDto } from '../../application/dtos/page-section-response.dto';
import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';

export class PageSectionMapper {
  static toDomain(record: PrismaPageSection): PageSectionEntity {
    return PageSectionEntity.create({
      id: record.id,
      page: record.page,
      sectionKey: record.sectionKey,
      locale: record.locale,
      titleText: record.titleText,
      subtitleText: record.subtitleText,
      bodyText: record.bodyText,
      ctaPrimaryLabel: record.ctaPrimaryLabel,
      ctaSecondaryLabel: record.ctaSecondaryLabel,
      dataJson: record.dataJson,
      mediaId: record.mediaId,
      status: record.status,
      updatedById: record.updatedById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: PageSectionEntity): PageSectionResponseDto {
    const dto = new PageSectionResponseDto();
    dto.id = entity.id;
    dto.page = entity.page;
    dto.sectionKey = entity.sectionKey;
    dto.locale = entity.locale as SharedLocale;
    dto.titleText = entity.titleText;
    dto.subtitleText = entity.subtitleText;
    dto.bodyText = entity.bodyText;
    dto.ctaPrimaryLabel = entity.ctaPrimaryLabel;
    dto.ctaSecondaryLabel = entity.ctaSecondaryLabel;
    dto.dataJson = entity.dataJson;
    dto.mediaId = entity.mediaId;
    dto.status = entity.status as SharedContentStatus;
    dto.updatedById = entity.updatedById;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  static versionToDomain(record: PrismaPageSectionVersion): PageSectionVersionEntity {
    return PageSectionVersionEntity.create({
      id: record.id,
      pageSectionId: record.pageSectionId,
      snapshotJson: record.snapshotJson as Record<string, unknown>,
      editedById: record.editedById,
      createdAt: record.createdAt,
    });
  }

  static versionToResponseDto(entity: PageSectionVersionEntity): PageSectionVersionResponseDto {
    const dto = new PageSectionVersionResponseDto();
    dto.id = entity.id;
    dto.pageSectionId = entity.pageSectionId;
    dto.snapshotJson = entity.snapshotJson;
    dto.editedById = entity.editedById;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
