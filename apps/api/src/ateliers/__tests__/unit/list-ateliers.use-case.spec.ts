import { ListAteliersUseCase } from '../../application/use-cases/list-ateliers.use-case';
import type { IAtelierRepository } from '../../domain/repositories/atelier.repository';

function buildRepository(): jest.Mocked<IAtelierRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn() };
}

describe('ListAteliersUseCase', () => {
  it('delegates to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue([]);
    const useCase = new ListAteliersUseCase(repository);

    const result = await useCase.execute();

    expect(repository.list).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
