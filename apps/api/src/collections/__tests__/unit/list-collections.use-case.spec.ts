import { ListCollectionsUseCase } from '../../application/use-cases/list-collections.use-case';
import type { ICollectionRepository } from '../../domain/repositories/collection.repository';

function buildRepository(): jest.Mocked<ICollectionRepository> {
  return { findPublishedBySlug: jest.fn(), list: jest.fn() };
}

describe('ListCollectionsUseCase', () => {
  it('delegates the filter to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue({ items: [], total: 0 });
    const useCase = new ListCollectionsUseCase(repository);

    const filter = { seasonYear: 2026, sort: 'seasonYear:asc' as const, page: 1, limit: 20 };
    const result = await useCase.execute(filter);

    expect(repository.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
