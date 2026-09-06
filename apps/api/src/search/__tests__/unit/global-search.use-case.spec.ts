import { BadRequestException } from '@nestjs/common';

import { GlobalSearchUseCase } from '../../application/use-cases/global-search.use-case';
import type { ISearchRepository } from '../../domain/repositories/search.repository';

function buildRepository(): jest.Mocked<ISearchRepository> {
  return { search: jest.fn() };
}

const EMPTY_RESULTS = { creations: [], products: [], collections: [], blogPosts: [], ateliers: [] };

describe('GlobalSearchUseCase', () => {
  it('trims the query and delegates to the repository with the default limitPerType', async () => {
    const repository = buildRepository();
    repository.search.mockResolvedValue(EMPTY_RESULTS);
    const useCase = new GlobalSearchUseCase(repository);

    await useCase.execute('  robe  ');

    expect(repository.search).toHaveBeenCalledWith('robe', 5);
  });

  it('forwards a custom limitPerType', async () => {
    const repository = buildRepository();
    repository.search.mockResolvedValue(EMPTY_RESULTS);
    const useCase = new GlobalSearchUseCase(repository);

    await useCase.execute('robe', 10);

    expect(repository.search).toHaveBeenCalledWith('robe', 10);
  });

  it('throws BadRequestException for a query shorter than the minimum length, without querying the repository', async () => {
    const repository = buildRepository();
    const useCase = new GlobalSearchUseCase(repository);

    await expect(useCase.execute('r')).rejects.toThrow(BadRequestException);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for an empty query', async () => {
    const repository = buildRepository();
    const useCase = new GlobalSearchUseCase(repository);

    await expect(useCase.execute('')).rejects.toThrow(BadRequestException);
  });
});
