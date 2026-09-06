import { ListCreationsUseCase } from '../../application/use-cases/list-creations.use-case';
import type { ICreationRepository } from '../../domain/repositories/creation.repository';

function buildRepository(): jest.Mocked<ICreationRepository> {
  return { findBySlug: jest.fn(), list: jest.fn() };
}

describe('ListCreationsUseCase', () => {
  it('delegates the filter to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue({ items: [], total: 0 });
    const useCase = new ListCreationsUseCase(repository);

    const filter = { categoryId: 'cat-1', page: 1, limit: 20 } as const;
    const result = await useCase.execute(filter);

    expect(repository.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
