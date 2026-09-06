import { UploadMediaBufferUseCase } from '../../application/use-cases/upload-media-buffer.use-case';
import type { MediaEntity } from '../../domain/entities/media.entity';
import type { IMediaStorageGateway } from '../../domain/repositories/media-storage.gateway';
import type { IMediaRepository } from '../../domain/repositories/media.repository';

function buildRepository(): jest.Mocked<IMediaRepository> {
  return {
    create: jest.fn((media: MediaEntity) => Promise.resolve(media)),
    findById: jest.fn(),
    list: jest.fn(),
    delete: jest.fn(),
    countActiveReferences: jest.fn(),
  };
}

function buildGateway(): jest.Mocked<IMediaStorageGateway> {
  return {
    createPresignedUploadUrl: jest.fn(),
    uploadBuffer: jest.fn(
      (
        _bucket: string,
        _buffer: Buffer,
        _options: { originalFilename: string; mimeType: string; keyPrefix?: string },
      ) => Promise.resolve({ objectKey: 'generated-key.jpg', sizeBytes: 4096 }),
    ),
    buildPublicUrl: jest.fn(
      (_bucket: string, _objectKey: string) => 'http://localhost:9000/collections/generated-key.jpg',
    ),
    deleteObject: jest.fn(),
  };
}

describe('UploadMediaBufferUseCase', () => {
  it('uploads the buffer to the resolved bucket and persists the resulting Media', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    const useCase = new UploadMediaBufferUseCase(repository, gateway);

    const media = await useCase.execute({
      entityType: 'COLLECTION',
      entityId: 'collection-1',
      altText: 'Collection Éternelle — vue d’ensemble',
      originalFilename: 'collection.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });

    expect(gateway.uploadBuffer).toHaveBeenCalledWith(
      'collections',
      expect.any(Buffer),
      expect.objectContaining({ originalFilename: 'collection.jpg', mimeType: 'image/jpeg' }),
    );
    expect(media.objectKey).toBe('generated-key.jpg');
    expect(media.sizeBytes).toBe(4096);
    expect(media.url).toBe('http://localhost:9000/collections/generated-key.jpg');
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown entityType before calling the storage gateway', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    const useCase = new UploadMediaBufferUseCase(repository, gateway);

    await expect(
      useCase.execute({
        entityType: 'NOT_A_TYPE',
        altText: 'x',
        originalFilename: 'x.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('x'),
      }),
    ).rejects.toThrow('Invalid MediaEntityType: NOT_A_TYPE');
    expect(gateway.uploadBuffer).not.toHaveBeenCalled();
  });
});
