import { ListSectionVersionsUseCase } from '../../application/use-cases/list-section-versions.use-case';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

describe('ListSectionVersionsUseCase', () => {
  it('delegates to the repository', async () => {
    const repository: jest.Mocked<IPageSectionRepository> = {
      listAll: jest.fn(),
      findAllLocales: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      saveWithSnapshot: jest.fn(),
      listVersions: jest.fn().mockResolvedValue([]),
      findVersionById: jest.fn(),
      restoreVersion: jest.fn(),
    };
    const useCase = new ListSectionVersionsUseCase(repository);

    await useCase.execute('section-1');

    expect(repository.listVersions).toHaveBeenCalledWith('section-1');
  });
});
