import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaPageSectionRepository } from '../../infrastructure/repositories/prisma-page-section.repository';

interface MockPageSectionDelegate {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  upsert: jest.Mock;
  update: jest.Mock;
}

interface MockPageSectionVersionDelegate {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
}

function buildPrismaServiceMock() {
  const pageSection: MockPageSectionDelegate = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  };
  const pageSectionVersion: MockPageSectionVersionDelegate = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const $transaction = jest.fn(
    (fn: (tx: { pageSection: MockPageSectionDelegate; pageSectionVersion: MockPageSectionVersionDelegate }) => unknown) =>
      Promise.resolve(fn({ pageSection, pageSectionVersion })),
  );
  const prisma = { pageSection, pageSectionVersion, $transaction } as unknown as PrismaService;
  return { prisma, pageSection, pageSectionVersion, $transaction };
}

function sampleRecord(overrides: Record<string, unknown> = {}) {
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
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('PrismaPageSectionRepository', () => {
  it('listAll() maps every row', async () => {
    const { prisma, pageSection } = buildPrismaServiceMock();
    pageSection.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaPageSectionRepository(prisma);

    const result = await repository.listAll();

    expect(result).toHaveLength(1);
  });

  it('findAllLocales() filters by page/sectionKey', async () => {
    const { prisma, pageSection } = buildPrismaServiceMock();
    pageSection.findMany.mockResolvedValue([sampleRecord()]);
    const repository = new PrismaPageSectionRepository(prisma);

    await repository.findAllLocales('accueil', 'hero');

    expect(pageSection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { page: 'accueil', sectionKey: 'hero' } }),
    );
  });

  it('findByKey() returns null when no row matches', async () => {
    const { prisma, pageSection } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(null);
    const repository = new PrismaPageSectionRepository(prisma);

    expect(await repository.findByKey('accueil', 'hero', 'FR')).toBeNull();
  });

  it('saveWithSnapshot() creates a new row with no prior snapshot when none exists yet', async () => {
    const { prisma, pageSection, pageSectionVersion } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(null);
    pageSection.upsert.mockResolvedValue(sampleRecord());
    const repository = new PrismaPageSectionRepository(prisma);

    await repository.saveWithSnapshot({
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Bienvenue',
      status: 'DRAFT',
      updatedById: 'admin-1',
    });

    expect(pageSectionVersion.create).not.toHaveBeenCalled();
    expect(pageSection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { page_sectionKey_locale: { page: 'accueil', sectionKey: 'hero', locale: 'FR' } },
      }),
    );
  });

  it('saveWithSnapshot() snapshots the prior row before overwriting it', async () => {
    const { prisma, pageSection, pageSectionVersion } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(sampleRecord({ titleText: 'Ancien titre' }));
    pageSection.upsert.mockResolvedValue(sampleRecord({ titleText: 'Nouveau titre' }));
    const repository = new PrismaPageSectionRepository(prisma);

    const result = await repository.saveWithSnapshot({
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Nouveau titre',
      status: 'DRAFT',
      updatedById: 'admin-1',
    });

    expect(pageSectionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pageSectionId: 'section-1',
          snapshotJson: expect.objectContaining({ titleText: 'Ancien titre' }),
        }),
      }),
    );
    expect(result.titleText).toBe('Nouveau titre');
  });

  it('listVersions() orders by createdAt desc', async () => {
    const { prisma, pageSectionVersion } = buildPrismaServiceMock();
    pageSectionVersion.findMany.mockResolvedValue([]);
    const repository = new PrismaPageSectionRepository(prisma);

    await repository.listVersions('section-1');

    expect(pageSectionVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pageSectionId: 'section-1' }, orderBy: { createdAt: 'desc' } }),
    );
  });

  it('findVersionById() scopes the lookup to the given pageSectionId', async () => {
    const { prisma, pageSectionVersion } = buildPrismaServiceMock();
    pageSectionVersion.findFirst.mockResolvedValue(null);
    const repository = new PrismaPageSectionRepository(prisma);

    expect(await repository.findVersionById('section-1', 'version-1')).toBeNull();
    expect(pageSectionVersion.findFirst).toHaveBeenCalledWith({ where: { id: 'version-1', pageSectionId: 'section-1' } });
  });

  it('restoreVersion() snapshots the current state, then applies the old snapshot', async () => {
    const { prisma, pageSection, pageSectionVersion } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(sampleRecord({ titleText: 'Titre courant' }));
    pageSectionVersion.findFirst.mockResolvedValue({
      id: 'version-1',
      pageSectionId: 'section-1',
      snapshotJson: {
        page: 'accueil',
        sectionKey: 'hero',
        locale: 'FR',
        titleText: 'Ancien titre',
        subtitleText: null,
        bodyText: null,
        ctaPrimaryLabel: null,
        ctaSecondaryLabel: null,
        dataJson: null,
        mediaId: null,
        status: 'PUBLISHED',
      },
      editedById: 'admin-1',
      createdAt: new Date('2026-01-01'),
    });
    pageSection.update.mockResolvedValue(sampleRecord({ titleText: 'Ancien titre', status: 'PUBLISHED' }));
    const repository = new PrismaPageSectionRepository(prisma);

    const result = await repository.restoreVersion('section-1', 'version-1', 'admin-2');

    expect(pageSectionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pageSectionId: 'section-1',
          snapshotJson: expect.objectContaining({ titleText: 'Titre courant' }),
          editedById: 'admin-2',
        }),
      }),
    );
    expect(pageSection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'section-1' },
        data: expect.objectContaining({ titleText: 'Ancien titre', status: 'PUBLISHED', updatedById: 'admin-2' }),
      }),
    );
    expect(result.titleText).toBe('Ancien titre');
  });

  it('restoreVersion() throws NotFoundException when the section does not exist', async () => {
    const { prisma, pageSection } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(null);
    const repository = new PrismaPageSectionRepository(prisma);

    await expect(repository.restoreVersion('missing', 'version-1', 'admin-1')).rejects.toThrow(NotFoundException);
  });

  it('restoreVersion() throws NotFoundException when the version does not exist for that section', async () => {
    const { prisma, pageSection, pageSectionVersion } = buildPrismaServiceMock();
    pageSection.findUnique.mockResolvedValue(sampleRecord());
    pageSectionVersion.findFirst.mockResolvedValue(null);
    const repository = new PrismaPageSectionRepository(prisma);

    await expect(repository.restoreVersion('section-1', 'missing', 'admin-1')).rejects.toThrow(NotFoundException);
  });
});
