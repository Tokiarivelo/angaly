import type {
  Media as PrismaMedia,
  PageSection as PrismaPageSection,
  PageSectionVersion as PrismaPageSectionVersion,
} from '@angaly/database';
import type { ContentStatus as SharedContentStatus, Locale as SharedLocale } from '@angaly/types';

import { PageSectionVersionResponseDto } from '../../application/dtos/page-section-version-response.dto';
import { PageSectionResponseDto } from '../../application/dtos/page-section-response.dto';
import { PublicPageSectionResponseDto } from '../../application/dtos/public-page-section-response.dto';
import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';

export type PrismaPageSectionWithMedia = PrismaPageSection & { media?: PrismaMedia | null };

export class PageSectionMapper {
  static toDomain(record: PrismaPageSectionWithMedia): PageSectionEntity {
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
      media: record.media ? { id: record.media.id, url: record.media.url, altText: record.media.altText } : null,
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
    dto.media = entity.media;
    dto.status = entity.status as SharedContentStatus;
    dto.updatedById = entity.updatedById;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }

  /** Public (unauthenticated) shape — no `status`/`updatedById`, see PublicPageSectionResponseDto. */
  static toPublicResponseDto(entity: PageSectionEntity): PublicPageSectionResponseDto {
    const dto = new PublicPageSectionResponseDto();
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
    dto.media = entity.media;
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
