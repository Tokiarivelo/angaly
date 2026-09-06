import { NotFoundException } from '@nestjs/common';

import { ListRelatedPostsUseCase } from '../../application/use-cases/list-related-posts.use-case';
import { BlogPostEntity } from '../../domain/entities/blog-post.entity';
import type { IBlogPostRepository } from '../../domain/repositories/blog-post.repository';

function buildRepository(): jest.Mocked<IBlogPostRepository> {
  return { findPublishedBySlug: jest.fn(), list: jest.fn(), listRelated: jest.fn() };
}

function samplePost(): BlogPostEntity {
  return BlogPostEntity.create({
    id: 'post-1',
    slug: 'choisir-sa-robe-de-mariee',
    title: 'Choisir sa robe de mariée',
    excerpt: 'excerpt',
    content: 'content',
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    category: { id: 'cat-1', slug: 'conseils-mode', name: 'Conseils mode' },
    author: { id: 'user-1', email: 'redaction@angaly.mg' },
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ListRelatedPostsUseCase', () => {
  it('resolves the current post first, then asks for related posts in its category, excluding it', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(samplePost());
    repository.listRelated.mockResolvedValue([]);
    const useCase = new ListRelatedPostsUseCase(repository);

    await useCase.execute('choisir-sa-robe-de-mariee', 5);

    expect(repository.listRelated).toHaveBeenCalledWith({ postId: 'post-1', categoryId: 'cat-1', limit: 5 });
  });

  it('defaults the limit to 3 when not given', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(samplePost());
    repository.listRelated.mockResolvedValue([]);
    const useCase = new ListRelatedPostsUseCase(repository);

    await useCase.execute('choisir-sa-robe-de-mariee');

    expect(repository.listRelated).toHaveBeenCalledWith(expect.objectContaining({ limit: 3 }));
  });

  it('throws NotFoundException when the current post does not exist or is unpublished', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(null);
    const useCase = new ListRelatedPostsUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
    expect(repository.listRelated).not.toHaveBeenCalled();
  });
});
