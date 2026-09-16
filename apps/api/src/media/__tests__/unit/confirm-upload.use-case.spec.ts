import { ConfirmUploadUseCase } from '../../application/use-cases/confirm-upload.use-case';
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
    update: jest.fn(),
    findUsages: jest.fn(),
  };
}

function buildGateway(): jest.Mocked<IMediaStorageGateway> {
  return {
    createPresignedUploadUrl: jest.fn(),
    uploadBuffer: jest.fn(),
    buildPublicUrl: jest.fn((_bucket: string, _objectKey: string) => 'http://localhost:9000/creations/abc.jpg'),
    deleteObject: jest.fn(),
  };
}

describe('ConfirmUploadUseCase', () => {
  it('persists a Media row built from the presigned-upload result', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    const useCase = new ConfirmUploadUseCase(repository, gateway);

    const media = await useCase.execute({
      bucket: 'creations',
      objectKey: 'abc.jpg',
      entityType: 'CREATION',
      entityId: 'creation-1',
      altText: 'Robe éternelle',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      width: 1200,
      height: 1600,
    });

    expect(gateway.buildPublicUrl).toHaveBeenCalledWith('creations', 'abc.jpg');
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(media.url).toBe('http://localhost:9000/creations/abc.jpg');
    expect(media.bucket).toBe('creations');
    expect(media.entityRef.entityType).toBe('CREATION');
    expect(media.entityRef.entityId).toBe('creation-1');
    expect(media.width).toBe(1200);
  });

  it('defaults width/height/entityId to null when omitted', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    const useCase = new ConfirmUploadUseCase(repository, gateway);

    const media = await useCase.execute({
      bucket: 'blog',
      objectKey: 'article.jpg',
      entityType: 'BLOG_POST',
      altText: 'Illustration article',
      mimeType: 'image/jpeg',
      sizeBytes: 512,
    });

    expect(media.width).toBeNull();
    expect(media.height).toBeNull();
    expect(media.entityRef.entityId).toBeNull();
    expect(media.uploadedById).toBeNull();
  });

  it('rejects an empty altText before touching the repository', async () => {
    const repository = buildRepository();
    const gateway = buildGateway();
    const useCase = new ConfirmUploadUseCase(repository, gateway);

    await expect(
      useCase.execute({
        bucket: 'creations',
        objectKey: 'abc.jpg',
        entityType: 'CREATION',
        altText: '   ',
        mimeType: 'image/jpeg',
        sizeBytes: 10,
      }),
    ).rejects.toThrow('Media.altText is required');
    expect(repository.create).not.toHaveBeenCalled();
  });
});
