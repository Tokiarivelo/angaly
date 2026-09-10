import { ListSimilarProductsUseCase } from '../../application/use-cases/list-similar-products.use-case';
import type { IProductRepository } from '../../domain/repositories/product.repository';

function buildRepository(): jest.Mocked<IProductRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn(), listSimilar: jest.fn(), findVariantById: jest.fn() };
}

describe('ListSimilarProductsUseCase', () => {
  it('delegates to the repository with the given filter', async () => {
    const repository = buildRepository();
    repository.listSimilar.mockResolvedValue([]);
    const useCase = new ListSimilarProductsUseCase(repository);

    const filter = { categoryId: 'cat-1', excludeProductId: 'product-1', limit: 4 };
    const result = await useCase.execute(filter);

    expect(repository.listSimilar).toHaveBeenCalledWith(filter);
    expect(result).toEqual([]);
  });
});
