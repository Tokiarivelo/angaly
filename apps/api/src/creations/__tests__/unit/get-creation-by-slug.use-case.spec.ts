import { NotFoundException } from '@nestjs/common';

import { GetCreationBySlugUseCase } from '../../application/use-cases/get-creation-by-slug.use-case';
import { CreationEntity } from '../../domain/entities/creation.entity';
import type { ICreationRepository } from '../../domain/repositories/creation.repository';

function buildRepository(): jest.Mocked<ICreationRepository> {
  return { findBySlug: jest.fn(), findById: jest.fn(), list: jest.fn() };
}

function sampleCreation(): CreationEntity {
  return CreationEntity.create({
    id: 'creation-1',
    slug: 'robe-eternelle',
    name: 'Robe Éternelle',
    description: 'Une robe intemporelle.',
    materials: null,
    techniques: null,
    availability: 'PIECE_UNIQUE',
    reproducible: true,
    isFeatured: false,
    featuredFrom: null,
    featuredUntil: null,
    category: { id: 'cat-1', slug: 'robes', name: 'Robes' },
    collection: null,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetCreationBySlugUseCase', () => {
  it('returns the creation when found', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(sampleCreation());
    const useCase = new GetCreationBySlugUseCase(repository);

    const result = await useCase.execute('robe-eternelle');

    expect(repository.findBySlug).toHaveBeenCalledWith('robe-eternelle');
    expect(result.slug).toBe('robe-eternelle');
  });

  it('throws NotFoundException when no creation matches the slug', async () => {
    const repository = buildRepository();
    repository.findBySlug.mockResolvedValue(null);
    const useCase = new GetCreationBySlugUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
