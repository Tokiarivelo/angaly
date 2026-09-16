import { NotFoundException } from '@nestjs/common';

import type { IMediaStorageGateway } from '../../domain/repositories/media-storage.gateway';
import { UpdateMediaUseCase } from '../../application/use-cases/update-media.use-case';
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

function buildStorageGateway(overrides: Partial<jest.Mocked<IMediaStorageGateway>> = {}): jest.Mocked<IMediaStorageGateway> {
  return {
    createPresignedUploadUrl: jest.fn(),
    uploadBuffer: jest.fn(),
    buildPublicUrl: jest.fn((bucket: string, objectKey: string) => `http://localhost:9000/${bucket}/${objectKey}`),
    deleteObject: jest.fn(),
    ...overrides,
  };
}

function sampleMedia(overrides: Partial<Parameters<typeof MediaEntity.create>[0]> = {}): MediaEntity {
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
    ...overrides,
  });
}

describe('UpdateMediaUseCase', () => {
  it('updates alt text without touching bucket/objectKey/url', async () => {
    const updated = sampleMedia({ altText: 'Nouveau texte' });
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(sampleMedia()),
      update: jest.fn().mockResolvedValue(updated),
    });
    const storageGateway = buildStorageGateway();
    const useCase = new UpdateMediaUseCase(repository, storageGateway);

    const result = await useCase.execute('media-1', { altText: 'Nouveau texte' });

    expect(repository.update).toHaveBeenCalledWith('media-1', { altText: 'Nouveau texte' });
    expect(storageGateway.buildPublicUrl).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });

  it('recomputes url via the storage gateway when replacing the binary (bucket/objectKey change)', async () => {
    const repository = buildRepository({
      findById: jest.fn().mockResolvedValue(sampleMedia()),
      update: jest.fn().mockResolvedValue(sampleMedia({ objectKey: 'new.jpg' })),
    });
    const storageGateway = buildStorageGateway();
    const useCase = new UpdateMediaUseCase(repository, storageGateway);

    await useCase.execute('media-1', { objectKey: 'new.jpg', mimeType: 'image/jpeg', sizeBytes: 200 });

    expect(storageGateway.buildPublicUrl).toHaveBeenCalledWith('creations', 'new.jpg');
    expect(repository.update).toHaveBeenCalledWith('media-1', {
      objectKey: 'new.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 200,
      bucket: 'creations',
      url: 'http://localhost:9000/creations/new.jpg',
    });
  });

  it('throws NotFoundException when the media does not exist', async () => {
    const repository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });
    const storageGateway = buildStorageGateway();
    const useCase = new UpdateMediaUseCase(repository, storageGateway);

    await expect(useCase.execute('missing', { altText: 'x' })).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
