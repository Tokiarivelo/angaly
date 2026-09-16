import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@angaly/database';

import { PrismaService } from '../../../prisma/prisma.service';
import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import {
  IPageSectionRepository,
  SaveSectionDraftInput,
} from '../../domain/repositories/page-section.repository';
import { LocaleValue } from '../../domain/value-objects/content-status.vo';
import { PageSectionMapper } from '../mappers/page-section.mapper';

interface SnapshotShape {
  page: string;
  sectionKey: string;
  locale: string;
  titleText: string | null;
  subtitleText: string | null;
  bodyText: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
  dataJson: unknown;
  mediaId: string | null;
  status: string;
}

function toSnapshotJson(entity: PageSectionEntity): Prisma.InputJsonValue {
  return entity.toSnapshot() as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class PrismaPageSectionRepository implements IPageSectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<PageSectionEntity[]> {
    const records = await this.prisma.pageSection.findMany({ orderBy: [{ page: 'asc' }, { sectionKey: 'asc' }] });
    return records.map((record) => PageSectionMapper.toDomain(record));
  }

  async findAllLocales(page: string, sectionKey: string): Promise<PageSectionEntity[]> {
    const records = await this.prisma.pageSection.findMany({
      where: { page, sectionKey },
      orderBy: { locale: 'asc' },
    });
    return records.map((record) => PageSectionMapper.toDomain(record));
  }

  /** PUBLISHED-only — never returns DRAFT rows. See IPageSectionRepository.findPublished. */
  async findPublished(page: string, locale?: LocaleValue): Promise<PageSectionEntity[]> {
    const records = await this.prisma.pageSection.findMany({
      where: { page, status: 'PUBLISHED', ...(locale ? { locale } : {}) },
      orderBy: { sectionKey: 'asc' },
    });
    return records.map((record) => PageSectionMapper.toDomain(record));
  }

  async findById(id: string): Promise<PageSectionEntity | null> {
    const record = await this.prisma.pageSection.findUnique({ where: { id } });
    return record ? PageSectionMapper.toDomain(record) : null;
  }

  async findByKey(page: string, sectionKey: string, locale: LocaleValue): Promise<PageSectionEntity | null> {
    const record = await this.prisma.pageSection.findUnique({
      where: { page_sectionKey_locale: { page, sectionKey, locale } },
    });
    return record ? PageSectionMapper.toDomain(record) : null;
  }

  /** Snapshots the row's prior full state before overwriting it — single transaction, never split across two requests. */
  async saveWithSnapshot(input: SaveSectionDraftInput): Promise<PageSectionEntity> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.pageSection.findUnique({
        where: { page_sectionKey_locale: { page: input.page, sectionKey: input.sectionKey, locale: input.locale } },
      });

      if (existing) {
        await tx.pageSectionVersion.create({
          data: {
            pageSectionId: existing.id,
            snapshotJson: toSnapshotJson(PageSectionMapper.toDomain(existing)),
            editedById: existing.updatedById,
          },
        });
      }

      return tx.pageSection.upsert({
        where: { page_sectionKey_locale: { page: input.page, sectionKey: input.sectionKey, locale: input.locale } },
        create: {
          page: input.page,
          sectionKey: input.sectionKey,
          locale: input.locale,
          titleText: input.titleText ?? null,
          subtitleText: input.subtitleText ?? null,
          bodyText: input.bodyText ?? null,
          ctaPrimaryLabel: input.ctaPrimaryLabel ?? null,
          ctaSecondaryLabel: input.ctaSecondaryLabel ?? null,
          dataJson: (input.dataJson ?? Prisma.JsonNull),
          mediaId: input.mediaId ?? null,
          status: input.status,
          updatedById: input.updatedById,
        },
        update: {
          titleText: input.titleText ?? null,
          subtitleText: input.subtitleText ?? null,
          bodyText: input.bodyText ?? null,
          ctaPrimaryLabel: input.ctaPrimaryLabel ?? null,
          ctaSecondaryLabel: input.ctaSecondaryLabel ?? null,
          dataJson: (input.dataJson ?? Prisma.JsonNull),
          mediaId: input.mediaId ?? null,
          status: input.status,
          updatedById: input.updatedById,
        },
      });
    });

    return PageSectionMapper.toDomain(record);
  }

  async listVersions(pageSectionId: string): Promise<PageSectionVersionEntity[]> {
    const records = await this.prisma.pageSectionVersion.findMany({
      where: { pageSectionId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => PageSectionMapper.versionToDomain(record));
  }

  async findVersionById(pageSectionId: string, versionId: string): Promise<PageSectionVersionEntity | null> {
    const record = await this.prisma.pageSectionVersion.findFirst({ where: { id: versionId, pageSectionId } });
    return record ? PageSectionMapper.versionToDomain(record) : null;
  }

  /** Snapshots the CURRENT (pre-restore) state first, so a restore is itself always undoable. */
  async restoreVersion(
    pageSectionId: string,
    versionId: string,
    restoredById: string | null,
  ): Promise<PageSectionEntity> {
    const record = await this.prisma.$transaction(async (tx) => {
      const current = await tx.pageSection.findUnique({ where: { id: pageSectionId } });
      if (!current) {
        throw new NotFoundException(`PageSection ${pageSectionId} not found`);
      }

      const version = await tx.pageSectionVersion.findFirst({ where: { id: versionId, pageSectionId } });
      if (!version) {
        throw new NotFoundException(`Version ${versionId} not found for section ${pageSectionId}`);
      }

      await tx.pageSectionVersion.create({
        data: {
          pageSectionId: current.id,
          snapshotJson: toSnapshotJson(PageSectionMapper.toDomain(current)),
          editedById: restoredById,
        },
      });

      const snapshot = version.snapshotJson as unknown as SnapshotShape;

      return tx.pageSection.update({
        where: { id: pageSectionId },
        data: {
          titleText: snapshot.titleText,
          subtitleText: snapshot.subtitleText,
          bodyText: snapshot.bodyText,
          ctaPrimaryLabel: snapshot.ctaPrimaryLabel,
          ctaSecondaryLabel: snapshot.ctaSecondaryLabel,
          dataJson: (snapshot.dataJson ?? Prisma.JsonNull),
          mediaId: snapshot.mediaId,
          status: snapshot.status as Prisma.PageSectionUpdateInput['status'],
          updatedById: restoredById,
        },
      });
    });

    return PageSectionMapper.toDomain(record);
  }
}
