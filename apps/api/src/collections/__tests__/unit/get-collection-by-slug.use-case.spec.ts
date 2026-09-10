import { NotFoundException } from '@nestjs/common';

import { GetCollectionBySlugUseCase } from '../../application/use-cases/get-collection-by-slug.use-case';
import { CollectionEntity } from '../../domain/entities/collection.entity';
import type { ICollectionRepository } from '../../domain/repositories/collection.repository';

function buildRepository(): jest.Mocked<ICollectionRepository> {
  return { findPublishedBySlug: jest.fn(), findById: jest.fn(), list: jest.fn() };
}

function sampleCollection(): CollectionEntity {
  return CollectionEntity.create({
    id: 'collection-1',
    slug: 'eternelle',
    name: 'Éternelle',
    description: null,
    story: null,
    seasonYear: 2026,
    publishedAt: new Date('2020-01-01T00:00:00.000Z'),
    media: [],
    creationsCount: 0,
    creations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetCollectionBySlugUseCase', () => {
  it('returns the collection when found (and published — enforced by the repository)', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(sampleCollection());
    const useCase = new GetCollectionBySlugUseCase(repository);

    const result = await useCase.execute('eternelle');

    expect(repository.findPublishedBySlug).toHaveBeenCalledWith('eternelle');
    expect(result.slug).toBe('eternelle');
  });

  it('throws NotFoundException when no published collection matches the slug', async () => {
    const repository = buildRepository();
    repository.findPublishedBySlug.mockResolvedValue(null);
    const useCase = new GetCollectionBySlugUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
