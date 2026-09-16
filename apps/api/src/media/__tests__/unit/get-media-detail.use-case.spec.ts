import { NotFoundException } from '@nestjs/common';

import { GetMediaDetailUseCase } from '../../application/use-cases/get-media-detail.use-case';
import { MediaEntity } from '../../domain/entities/media.entity';
import type { IMediaRepository } from '../../domain/repositories/media.repository';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';

function buildRepository(overrides: Partial<jest.Mocked<IMediaRepository>> = {}): jest.Mocked<IMediaRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countActiveReferences: jest.fn(),
    findUsages: jest.fn(),
    ...overrides,
  };
}

function sampleMedia(): MediaEntity {
  return MediaEntity.create({
    id: 'media-1',
    bucket: 'creations',
    objectKey: 'abc.jpg',
    url: 'http://localhost:9000/creations/abc.jpg',
    altText: 'Robe éternelle',
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: null,
    height: null,
    entityRef: MediaEntityRef.create('CREATION', 'creation-1'),
    sortOrder: 0,
    uploadedById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('GetMediaDetailUseCase', () => {
  it('returns the media with its resolved usages', async () => {
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(sampleMedia()),
      findUsages: jest.fn().mockResolvedValue([{ entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' }]),
    });
    const useCase = new GetMediaDetailUseCase(repository);

    const result = await useCase.execute('media-1');

    expect(result.media.id).toBe('media-1');
    expect(result.usedIn).toEqual([{ entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' }]);
  });

  it('throws NotFoundException when the media does not exist', async () => {
    const repository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new GetMediaDetailUseCase(repository);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
    expect(repository.findUsages).not.toHaveBeenCalled();
  });
});
