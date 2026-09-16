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
});
