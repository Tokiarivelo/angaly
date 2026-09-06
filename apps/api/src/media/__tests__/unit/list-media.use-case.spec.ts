import { ListMediaUseCase } from '../../application/use-cases/list-media.use-case';
import type { IMediaRepository } from '../../domain/repositories/media.repository';

function buildRepository(): jest.Mocked<IMediaRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    delete: jest.fn(),
    countActiveReferences: jest.fn(),
  };
}

describe('ListMediaUseCase', () => {
  it('delegates the filter to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue({ items: [], total: 0 });
    const useCase = new ListMediaUseCase(repository);

    const filter = { bucket: 'creations', page: 1, limit: 20 };
    const result = await useCase.execute(filter);

    expect(repository.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
