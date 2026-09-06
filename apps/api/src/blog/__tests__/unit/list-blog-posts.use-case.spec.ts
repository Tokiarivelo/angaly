import { ListBlogPostsUseCase } from '../../application/use-cases/list-blog-posts.use-case';
import type { IBlogPostRepository } from '../../domain/repositories/blog-post.repository';

function buildRepository(): jest.Mocked<IBlogPostRepository> {
  return { findPublishedBySlug: jest.fn(), list: jest.fn(), listRelated: jest.fn() };
}

describe('ListBlogPostsUseCase', () => {
  it('delegates the filter to the repository and returns its result', async () => {
    const repository = buildRepository();
    repository.list.mockResolvedValue({ items: [], total: 0 });
    const useCase = new ListBlogPostsUseCase(repository);

    const filter = { categoryId: 'cat-1', page: 1, limit: 20 };
    const result = await useCase.execute(filter);

    expect(repository.list).toHaveBeenCalledWith(filter);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
