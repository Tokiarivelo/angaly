import { PageSectionEntity } from '../../domain/entities/page-section.entity';
import { ListPublishedSectionsUseCase } from '../../application/use-cases/list-published-sections.use-case';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

function buildRepository(overrides: Partial<jest.Mocked<IPageSectionRepository>> = {}): jest.Mocked<IPageSectionRepository> {
  return {
    listAll: jest.fn(),
    findAllLocales: jest.fn(),
    findPublished: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByKey: jest.fn(),
    saveWithSnapshot: jest.fn(),
    listVersions: jest.fn(),
    findVersionById: jest.fn(),
    restoreVersion: jest.fn(),
    ...overrides,
  };
}

describe('ListPublishedSectionsUseCase', () => {
  it('delegates to findPublished with the page and no locale when none is given', async () => {
    const repository = buildRepository();
    const useCase = new ListPublishedSectionsUseCase(repository);

    await useCase.execute('accueil');

    expect(repository.findPublished).toHaveBeenCalledWith('accueil', undefined);
  });

  it('delegates to findPublished with the page and locale when one is given', async () => {
    const repository = buildRepository();
    const useCase = new ListPublishedSectionsUseCase(repository);

    await useCase.execute('accueil', 'FR');

    expect(repository.findPublished).toHaveBeenCalledWith('accueil', 'FR');
  });

  it('never calls listAll or findAllLocales, which would also surface DRAFT rows', async () => {
    const repository = buildRepository();
    const useCase = new ListPublishedSectionsUseCase(repository);

    await useCase.execute('accueil');

    expect(repository.listAll).not.toHaveBeenCalled();
    expect(repository.findAllLocales).not.toHaveBeenCalled();
  });

  it('returns exactly what the repository resolves', async () => {
    const publishedSections = [{ sectionKey: 'hero' }] as unknown as Awaited<ReturnType<IPageSectionRepository['findPublished']>>;
    const repository = buildRepository({ findPublished: jest.fn().mockResolvedValue(publishedSections) });
    const useCase = new ListPublishedSectionsUseCase(repository);

    const result = await useCase.execute('a-propos', 'FR');

    expect(result).toBe(publishedSections);
  });

  describe('non-base locale', () => {
    function row(sectionKey: string, locale: 'FR' | 'MG', titleText: string, mediaId: string | null = null) {
      return PageSectionEntity.create({
        id: `${sectionKey}-${locale}`,
        page: 'accueil',
        sectionKey,
        locale,
        titleText,
        subtitleText: null,
        bodyText: null,
        ctaPrimaryLabel: null,
        ctaSecondaryLabel: null,
        dataJson: null,
        mediaId,
        status: 'PUBLISHED',
        updatedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it('layers the MG translation over FR, inherits the FR image, and falls back to FR for untranslated sections', async () => {
      const repository = buildRepository({
        findPublished: jest
          .fn()
          .mockResolvedValue([row('hero', 'FR', 'Bonjour', 'img-fr'), row('hero', 'MG', 'Salama', 'img-mg'), row('maison', 'FR', 'La maison')]),
      });

      const result = await new ListPublishedSectionsUseCase(repository).execute('accueil', 'MG');

      expect(repository.findPublished).toHaveBeenCalledWith('accueil');
      expect(result.map((section) => [section.sectionKey, section.locale, section.titleText, section.mediaId])).toEqual([
        ['hero', 'MG', 'Salama', 'img-fr'],
        ['maison', 'FR', 'La maison', null],
      ]);
    });
  });
});
