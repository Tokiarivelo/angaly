import { NotFoundException } from '@nestjs/common';

import { GetBlogPostBySlugUseCase } from '../../application/use-cases/get-blog-post-by-slug.use-case';
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

describe('GetBlogPostBySlugUseCase', () => {
  it('returns the post when found (and published — enforced by the repository)', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(samplePost());
    const useCase = new GetBlogPostBySlugUseCase(repository);

    const result = await useCase.execute('choisir-sa-robe-de-mariee');

    expect(repository.findPublishedBySlug).toHaveBeenCalledWith('choisir-sa-robe-de-mariee');
    expect(result.slug).toBe('choisir-sa-robe-de-mariee');
  });

  it('throws NotFoundException when no published post matches the slug', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(null);
    const useCase = new GetBlogPostBySlugUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
