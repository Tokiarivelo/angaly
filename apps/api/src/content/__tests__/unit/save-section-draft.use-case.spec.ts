import { SaveSectionDraftUseCase } from '../../application/use-cases/save-section-draft.use-case';
import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

describe('SaveSectionDraftUseCase', () => {
  it('always saves with status DRAFT, forwarding every field to saveWithSnapshot', async () => {
    const saved = PageSectionEntity.create({
      id: 'section-1',
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Nouveau titre',
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
    const repository: jest.Mocked<IPageSectionRepository> = {
      listAll: jest.fn(),
      findAllLocales: jest.fn(),
      findPublished: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      saveWithSnapshot: jest.fn().mockResolvedValue(saved),
      listVersions: jest.fn(),
      findVersionById: jest.fn(),
      restoreVersion: jest.fn(),
    };
    const useCase = new SaveSectionDraftUseCase(repository);

    const result = await useCase.execute({
      page: 'accueil',
      sectionKey: 'hero',
      locale: 'FR',
      titleText: 'Nouveau titre',
      actorId: 'admin-1',
    });

    expect(repository.saveWithSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ page: 'accueil', sectionKey: 'hero', locale: 'FR', titleText: 'Nouveau titre', status: 'DRAFT', updatedById: 'admin-1' }),
    );
    expect(result).toBe(saved);
  });
});
