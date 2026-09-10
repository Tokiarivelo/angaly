import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import type { IProductRepository } from '../../domain/repositories/product.repository';

function buildRepository(): jest.Mocked<IProductRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn(), listSimilar: jest.fn(), findVariantById: jest.fn() };
}

describe('ListProductsUseCase', () => {
  it('delegates the filter to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue({ items: [], total: 0 });
    const useCase = new ListProductsUseCase(repository);

    const filter = { categoryId: 'cat-1', size: 'S', page: 1, limit: 20 } as const;
    const result = await useCase.execute(filter);

    expect(repository.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
