import type { IMediaStorageGateway } from '../../domain/repositories/media-storage.gateway';
import { CreatePresignedUploadUseCase } from '../../application/use-cases/create-presigned-upload.use-case';

function buildGateway(): jest.Mocked<IMediaStorageGateway> {
  return {
    createPresignedUploadUrl: jest.fn(),
    uploadBuffer: jest.fn(),
    buildPublicUrl: jest.fn(),
    deleteObject: jest.fn(),
  };
}

describe('CreatePresignedUploadUseCase', () => {
  it('derives the bucket from entityType and returns the presigned URL', async () => {
    const gateway = buildGateway();
    gateway.createPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'http://minio/creations/xyz.jpg?signature=1',
      expiresInSeconds: 600,
    });
    const useCase = new CreatePresignedUploadUseCase(gateway);

    const result = await useCase.execute({
      entityType: 'CREATION',
      originalFilename: 'robe.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result.bucket).toBe('creations');
    expect(result.objectKey).toMatch(/\.jpg$/);
    expect(result.uploadUrl).toBe('http://minio/creations/xyz.jpg?signature=1');
    expect(result.expiresInSeconds).toBe(600);
    expect(gateway.createPresignedUploadUrl).toHaveBeenCalledWith('creations', result.objectKey);
  });

  it('applies the keyPrefix when provided', async () => {
    const gateway = buildGateway();
    gateway.createPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'http://minio/ateliers/xyz.png',
      expiresInSeconds: 600,
    });
    const useCase = new CreatePresignedUploadUseCase(gateway);

    const result = await useCase.execute({
      entityType: 'ATELIER',
      originalFilename: 'atelier.png',
      mimeType: 'image/png',
      keyPrefix: 'antananarivo-centre',
    });

    expect(result.bucket).toBe('ateliers');
    expect(result.objectKey).toMatch(/^antananarivo-centre\/.+\.png$/);
  });

  it('rejects an unknown entityType', async () => {
    const gateway = buildGateway();
    const useCase = new CreatePresignedUploadUseCase(gateway);

    await expect(
      useCase.execute({ entityType: 'NOT_A_TYPE', originalFilename: 'x.jpg', mimeType: 'image/jpeg' }),
    ).rejects.toThrow('Invalid MediaEntityType: NOT_A_TYPE');
    expect(gateway.createPresignedUploadUrl).not.toHaveBeenCalled();
  });
});
