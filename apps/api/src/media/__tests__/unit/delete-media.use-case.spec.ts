import { ConflictException, NotFoundException } from '@nestjs/common';

import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case';
import { MediaEntity } from '../../domain/entities/media.entity';
import type { IMediaStorageGateway } from '../../domain/repositories/media-storage.gateway';
import type { IMediaRepository } from '../../domain/repositories/media.repository';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';

function buildRepository(): jest.Mocked<IMediaRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    delete: jest.fn(),
    countActiveReferences: jest.fn(),
    update: jest.fn(),
    findUsages: jest.fn(),
  };
}

function buildGateway(): jest.Mocked<IMediaStorageGateway> {
  return {
    createPresignedUploadUrl: jest.fn(),
    uploadBuffer: jest.fn(),
    buildPublicUrl: jest.fn(),
    deleteObject: jest.fn(),
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
    createdAt: new Date(),
  });
}

describe('DeleteMediaUseCase', () => {
  it('deletes the MinIO object and the row when unreferenced', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    repository.findById.mockResolvedValue(sampleMedia());
    repository.countActiveReferences.mockResolvedValue(0);
    const useCase = new DeleteMediaUseCase(repository, gateway);

    await useCase.execute('media-1');

    expect(gateway.deleteObject).toHaveBeenCalledWith('creations', 'abc.jpg');
    expect(repository.delete).toHaveBeenCalledWith('media-1');
  });

  it('throws NotFoundException when the media does not exist', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    repository.findById.mockResolvedValue(null);
    const useCase = new DeleteMediaUseCase(repository, gateway);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
    expect(gateway.deleteObject).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete a media still referenced by another table', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    repository.findById.mockResolvedValue(sampleMedia());
    repository.countActiveReferences.mockResolvedValue(2);
    const useCase = new DeleteMediaUseCase(repository, gateway);

    await expect(useCase.execute('media-1')).rejects.toThrow(ConflictException);
    expect(gateway.deleteObject).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
