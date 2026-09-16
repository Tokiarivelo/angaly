import { NotFoundException } from '@nestjs/common';

import { PublishSectionUseCase } from '../../application/use-cases/publish-section.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

function buildRepository(overrides: Partial<jest.Mocked<IPageSectionRepository>> = {}): jest.Mocked<IPageSectionRepository> {
  return {
    listAll: jest.fn(),
    findAllLocales: jest.fn(),
      findPublished: jest.fn(),
    findById: jest.fn(),
    findByKey: jest.fn(),
    saveWithSnapshot: jest.fn(),
    listVersions: jest.fn(),
    findVersionById: jest.fn(),
    restoreVersion: jest.fn(),
    ...overrides,
  };
}

function buildSection(overrides: Partial<Parameters<typeof PageSectionEntity.create>[0]> = {}) {
  return PageSectionEntity.create({
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('PublishSectionUseCase', () => {
  it('flips the status to PUBLISHED, keeping the existing content fields', async () => {
    const existing = buildSection();
    const published = buildSection({ status: 'PUBLISHED', updatedById: 'admin-1' });
    const repository = buildRepository({
      findByKey: jest.fn().mockResolvedValue(existing),
      saveWithSnapshot: jest.fn().mockResolvedValue(published),
    });
    const useCase = new PublishSectionUseCase(repository);

    const result = await useCase.execute({ page: 'accueil', sectionKey: 'hero', locale: 'FR', actorId: 'admin-1' });

    expect(repository.saveWithSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ titleText: 'Bienvenue', status: 'PUBLISHED', updatedById: 'admin-1' }),
    );
    expect(result).toBe(published);
  });

  it('throws NotFoundException when no draft has ever been saved for that locale', async () => {
    const repository = buildRepository({ findByKey: jest.fn().mockResolvedValue(null) });
    const useCase = new PublishSectionUseCase(repository);

    await expect(
      useCase.execute({ page: 'accueil', sectionKey: 'hero', locale: 'FR', actorId: 'admin-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.saveWithSnapshot).not.toHaveBeenCalled();
  });
});
