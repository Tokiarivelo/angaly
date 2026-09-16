import type { PageSection as PrismaPageSection, PageSectionVersion as PrismaPageSectionVersion } from '@angaly/database';

import { PageSectionMapper } from '../../infrastructure/mappers/page-section.mapper';

function buildRecord(overrides: Partial<PrismaPageSection> = {}): PrismaPageSection {
  return {
    id: 'section-1',
    page: 'accueil',
    sectionKey: 'hero',
    locale: 'FR',
    titleText: 'Bienvenue',
    subtitleText: null,
    bodyText: null,
    ctaPrimaryLabel: null,
    ctaSecondaryLabel: null,
    dataJson: null,
    mediaId: null,
    status: 'DRAFT',
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  };
}

function buildVersionRecord(overrides: Partial<PrismaPageSectionVersion> = {}): PrismaPageSectionVersion {
  return {
    id: 'version-1',
    pageSectionId: 'section-1',
    snapshotJson: { titleText: 'Ancien titre' },
    editedById: 'user-1',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('PageSectionMapper', () => {
  it('maps a Prisma record to a domain entity', () => {
    const entity = PageSectionMapper.toDomain(buildRecord());
    expect(entity.page).toBe('accueil');
    expect(entity.locale).toBe('FR');
  });

  it('maps a domain entity to a response DTO', () => {
    const entity = PageSectionMapper.toDomain(buildRecord());
    const dto = PageSectionMapper.toResponseDto(entity);

    expect(dto).toMatchObject({
      id: 'section-1',
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Bienvenue',
      status: 'DRAFT',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('maps a Prisma version record to a domain entity', () => {
    const entity = PageSectionMapper.versionToDomain(buildVersionRecord());
    expect(entity.id).toBe('version-1');
    expect(entity.snapshotJson).toEqual({ titleText: 'Ancien titre' });
  });

  it('maps a version domain entity to a response DTO', () => {
    const entity = PageSectionMapper.versionToDomain(buildVersionRecord());
    const dto = PageSectionMapper.versionToResponseDto(entity);

    expect(dto).toMatchObject({ id: 'version-1', pageSectionId: 'section-1', editedById: 'user-1' });
  });
});
