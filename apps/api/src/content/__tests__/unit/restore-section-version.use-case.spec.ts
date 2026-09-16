import { NotFoundException } from '@nestjs/common';

import { RestoreSectionVersionUseCase } from '../../application/use-cases/restore-section-version.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import { PageSectionVersionEntity } from '../../domain/entities/page-section-version.entity';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

function buildRepository(overrides: Partial<jest.Mocked<IPageSectionRepository>> = {}): jest.Mocked<IPageSectionRepository> {
  return {
    listAll: jest.fn(),
    findAllLocales: jest.fn(),
    findById: jest.fn(),
    findByKey: jest.fn(),
    saveWithSnapshot: jest.fn(),
    listVersions: jest.fn(),
    findVersionById: jest.fn(),
    restoreVersion: jest.fn(),
    ...overrides,
  };
}

describe('RestoreSectionVersionUseCase', () => {
  it('restores the version after checking it exists', async () => {
    const version = PageSectionVersionEntity.create({
      id: 'version-1',
      pageSectionId: 'section-1',
      snapshotJson: { titleText: 'Ancien titre' },
      editedById: 'user-1',
      createdAt: new Date(),
    });
    const restored = PageSectionEntity.create({
      id: 'section-1',
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
      status: 'DRAFT',
      updatedById: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repository = buildRepository({
      findVersionById: jest.fn().mockResolvedValue(version),
      restoreVersion: jest.fn().mockResolvedValue(restored),
    });
    const useCase = new RestoreSectionVersionUseCase(repository);

    const result = await useCase.execute({ pageSectionId: 'section-1', versionId: 'version-1', actorId: 'admin-1' });

    expect(repository.restoreVersion).toHaveBeenCalledWith('section-1', 'version-1', 'admin-1');
    expect(result).toBe(restored);
  });

  it('throws NotFoundException when the version does not exist for that section', async () => {
    const repository = buildRepository({ findVersionById: jest.fn().mockResolvedValue(null) });
    const useCase = new RestoreSectionVersionUseCase(repository);

    await expect(
      useCase.execute({ pageSectionId: 'section-1', versionId: 'missing', actorId: 'admin-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.restoreVersion).not.toHaveBeenCalled();
  });
});
