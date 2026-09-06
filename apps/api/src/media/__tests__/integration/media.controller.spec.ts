import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ConfirmUploadUseCase } from '../../application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from '../../application/use-cases/create-presigned-upload.use-case';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case';
import { ListMediaUseCase } from '../../application/use-cases/list-media.use-case';
import { UploadMediaBufferUseCase } from '../../application/use-cases/upload-media-buffer.use-case';
import { MediaEntity } from '../../domain/entities/media.entity';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';
import { MediaController } from '../../presentation/controllers/media.controller';

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

describe('MediaController (integration)', () => {
  let app: INestApplication;
  const createPresignedUploadUseCase = { execute: jest.fn() };
  const confirmUploadUseCase = { execute: jest.fn() };
  const uploadMediaBufferUseCase = { execute: jest.fn() };
  const listMediaUseCase = { execute: jest.fn() };
  const deleteMediaUseCase = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: CreatePresignedUploadUseCase, useValue: createPresignedUploadUseCase },
        { provide: ConfirmUploadUseCase, useValue: confirmUploadUseCase },
        { provide: UploadMediaBufferUseCase, useValue: uploadMediaBufferUseCase },
        { provide: ListMediaUseCase, useValue: listMediaUseCase },
        { provide: DeleteMediaUseCase, useValue: deleteMediaUseCase },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  it('POST /media/presigned-upload returns the generated upload URL', async () => {
    createPresignedUploadUseCase.execute.mockResolvedValue({
      bucket: 'creations',
      objectKey: 'abc.jpg',
      uploadUrl: 'http://minio/creations/abc.jpg?sig=1',
      expiresInSeconds: 600,
    });

    const response = await request(server())
      .post('/media/presigned-upload')
      .send({ entityType: 'CREATION', originalFilename: 'robe.jpg', mimeType: 'image/jpeg' })
      .expect(201);

    expect(response.body).toEqual({
      bucket: 'creations',
      objectKey: 'abc.jpg',
      uploadUrl: 'http://minio/creations/abc.jpg?sig=1',
      expiresInSeconds: 600,
    });
  });

  it('POST /media/presigned-upload rejects an invalid entityType with 400', async () => {
    await request(server())
      .post('/media/presigned-upload')
      .send({ entityType: 'NOT_A_TYPE', originalFilename: 'robe.jpg', mimeType: 'image/jpeg' })
      .expect(400);

    expect(createPresignedUploadUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST /media/confirm returns the created media as a DTO', async () => {
    confirmUploadUseCase.execute.mockResolvedValue(sampleMedia());

    const response = await request(server())
      .post('/media/confirm')
      .send({
        bucket: 'creations',
        objectKey: 'abc.jpg',
        entityType: 'CREATION',
        entityId: 'creation-1',
        altText: 'Robe éternelle',
        mimeType: 'image/jpeg',
        sizeBytes: 100,
      })
      .expect(201);

    expect(response.body).toMatchObject({ id: 'media-1', url: 'http://localhost:9000/creations/abc.jpg' });
  });

  it('GET /media returns a paginated response using default pagination', async () => {
    listMediaUseCase.execute.mockResolvedValue({ items: [sampleMedia()], total: 1 });

    const response = await request(server()).get('/media').expect(200);

    expect(listMediaUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    const body = response.body as { data: unknown[]; meta: Record<string, unknown> };
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('GET /media reports hasNextPage/hasPreviousPage across a middle page', async () => {
    listMediaUseCase.execute.mockResolvedValue({ items: [sampleMedia()], total: 25 });

    const response = await request(server())
      .get('/media')
      .query({ page: 2, limit: 10, bucket: 'creations' })
      .expect(200);

    expect(listMediaUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10, bucket: 'creations' }),
    );
    const body = response.body as { meta: Record<string, unknown> };
    expect(body.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('DELETE /media/:id returns 204 on success', async () => {
    deleteMediaUseCase.execute.mockResolvedValue(undefined);

    await request(server()).delete('/media/media-1').expect(204);

    expect(deleteMediaUseCase.execute).toHaveBeenCalledWith('media-1');
  });

  it('POST /media/upload accepts multipart form data and returns the created media', async () => {
    uploadMediaBufferUseCase.execute.mockResolvedValue(sampleMedia());

    const response = await request(server())
      .post('/media/upload')
      .field('entityType', 'CREATION')
      .field('altText', 'Robe éternelle')
      .attach('file', Buffer.from('fake-image-bytes'), 'robe.jpg')
      .expect(201);

    expect(uploadMediaBufferUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'CREATION',
        altText: 'Robe éternelle',
        originalFilename: 'robe.jpg',
        mimeType: 'image/jpeg',
      }),
    );
    expect((response.body as { id: string }).id).toBe('media-1');
  });
});
