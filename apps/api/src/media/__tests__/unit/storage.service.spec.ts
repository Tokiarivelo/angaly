const mockClient = {
  getPresignedUploadUrl: jest.fn(),
  uploadBuffer: jest.fn(),
  buildPublicUrl: jest.fn(),
  deleteObject: jest.fn(),
};

jest.mock('@angaly/storage', () => ({
  createStorageClientFromEnv: jest.fn(() => mockClient),
}));

import { StorageService } from '../../infrastructure/services/storage.service';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createPresignedUploadUrl() delegates to the MinIO client with the default expiry', async () => {
    mockClient.getPresignedUploadUrl.mockResolvedValue('http://minio/creations/abc.jpg?sig=1');
    const service = new StorageService();

    const result = await service.createPresignedUploadUrl('creations', 'abc.jpg');

    expect(mockClient.getPresignedUploadUrl).toHaveBeenCalledWith('creations', 'abc.jpg', 600);
    expect(result).toEqual({ uploadUrl: 'http://minio/creations/abc.jpg?sig=1', expiresInSeconds: 600 });
  });

  it('uploadBuffer() delegates to the MinIO client and returns objectKey/sizeBytes', async () => {
    mockClient.uploadBuffer.mockResolvedValue({
      bucket: 'blog',
      objectKey: 'generated.jpg',
      url: 'http://minio/blog/generated.jpg',
      sizeBytes: 2048,
    });
    const service = new StorageService();

    const result = await service.uploadBuffer('blog', Buffer.from('x'), {
      originalFilename: 'article.jpg',
      mimeType: 'image/jpeg',
    });

    expect(result).toEqual({ objectKey: 'generated.jpg', sizeBytes: 2048 });
  });

  it('buildPublicUrl() delegates to the MinIO client', () => {
    mockClient.buildPublicUrl.mockReturnValue('http://minio/creations/abc.jpg');
    const service = new StorageService();

    expect(service.buildPublicUrl('creations', 'abc.jpg')).toBe('http://minio/creations/abc.jpg');
  });

  it('deleteObject() delegates to the MinIO client', async () => {
    const service = new StorageService();

    await service.deleteObject('creations', 'abc.jpg');

    expect(mockClient.deleteObject).toHaveBeenCalledWith('creations', 'abc.jpg');
  });
});
