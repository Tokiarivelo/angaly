import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import type { ICategoryRepository } from '../../domain/repositories/category.repository';

function buildRepository(): jest.Mocked<ICategoryRepository> {
  return { list: jest.fn() };
}

describe('ListCategoriesUseCase', () => {
  it('delegates to the repository with no kind by default', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue([]);
    const useCase = new ListCategoriesUseCase(repository);

    const result = await useCase.execute();

    expect(repository.list).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([]);
  });

  it('passes the requested kind through to the repository', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue([]);
    const useCase = new ListCategoriesUseCase(repository);

    await useCase.execute('CREATION');

    expect(repository.list).toHaveBeenCalledWith('CREATION');
  });
});
