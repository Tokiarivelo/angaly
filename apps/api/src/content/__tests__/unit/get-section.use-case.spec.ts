import { GetSectionUseCase } from '../../application/use-cases/get-section.use-case';
import type { IPageSectionRepository } from '../../domain/repositories/page-section.repository';

describe('GetSectionUseCase', () => {
  it('delegates to findAllLocales', async () => {
    const repository: jest.Mocked<IPageSectionRepository> = {
      listAll: jest.fn(),
      findAllLocales: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findByKey: jest.fn(),
      saveWithSnapshot: jest.fn(),
      listVersions: jest.fn(),
      findVersionById: jest.fn(),
      restoreVersion: jest.fn(),
    };
    const useCase = new GetSectionUseCase(repository);

    await useCase.execute('accueil', 'hero');

    expect(repository.findAllLocales).toHaveBeenCalledWith('accueil', 'hero');
  });
});
