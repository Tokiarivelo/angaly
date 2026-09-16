import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ConfirmUploadUseCase } from '../../application/use-cases/confirm-upload.use-case';
import { CreatePresignedUploadUseCase } from '../../application/use-cases/create-presigned-upload.use-case';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case';
import { GetMediaDetailUseCase } from '../../application/use-cases/get-media-detail.use-case';
import { ListMediaUseCase } from '../../application/use-cases/list-media.use-case';
import { UpdateMediaUseCase } from '../../application/use-cases/update-media.use-case';
import { UploadMediaBufferUseCase } from '../../application/use-cases/upload-media-buffer.use-case';
import { MediaEntity } from '../../domain/entities/media.entity';
import { MediaEntityRef } from '../../domain/value-objects/media-entity-ref.vo';
import { MediaController } from '../../presentation/controllers/media.controller';
import { MAX_MEDIA_UPLOAD_SIZE_BYTES } from '@angaly/types';

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
  const getMediaDetailUseCase = { execute: jest.fn() };
  const updateMediaUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: CreatePresignedUploadUseCase, useValue: createPresignedUploadUseCase },
        { provide: ConfirmUploadUseCase, useValue: confirmUploadUseCase },
        { provide: UploadMediaBufferUseCase, useValue: uploadMediaBufferUseCase },
        { provide: ListMediaUseCase, useValue: listMediaUseCase },
        { provide: DeleteMediaUseCase, useValue: deleteMediaUseCase },
        { provide: GetMediaDetailUseCase, useValue: getMediaDetailUseCase },
        { provide: UpdateMediaUseCase, useValue: updateMediaUseCase },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'admin-1', role: 'ADMIN' });
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

  it('POST /media/confirm rejects a sizeBytes over the 20 Mo limit with 400', async () => {
    await request(server())
      .post('/media/confirm')
      .send({
        bucket: 'creations',
        objectKey: 'abc.jpg',
        entityType: 'CREATION',
        altText: 'Robe éternelle',
        mimeType: 'image/jpeg',
        sizeBytes: MAX_MEDIA_UPLOAD_SIZE_BYTES + 1,
      })
      .expect(400);

    expect(confirmUploadUseCase.execute).not.toHaveBeenCalled();
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

  it('DELETE /media/:id returns 204 on success for a MANAGER', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'manager-1', role: 'MANAGER' });
    deleteMediaUseCase.execute.mockResolvedValue(undefined);

    await request(server())
      .delete('/media/media-1')
      .set('Authorization', 'Bearer valid-token')
      .expect(204);

    expect(deleteMediaUseCase.execute).toHaveBeenCalledWith('media-1');
  });

  it('DELETE /media/:id returns 401 with no token', async () => {
    await request(server()).delete('/media/media-1').expect(401);
    expect(deleteMediaUseCase.execute).not.toHaveBeenCalled();
  });

  it('DELETE /media/:id returns 403 for a CLIENT', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'client-1', role: 'CLIENT' });

    await request(server())
      .delete('/media/media-1')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);

    expect(deleteMediaUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /media/:id returns the media with its resolved usages for a MANAGER', async () => {
    getMediaDetailUseCase.execute.mockResolvedValue({
      media: sampleMedia(),
      usedIn: [{ entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' }],
    });

    const response = await request(server())
      .get('/media/media-1')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(getMediaDetailUseCase.execute).toHaveBeenCalledWith('media-1');
    expect(response.body).toMatchObject({
      id: 'media-1',
      usedIn: [{ entityType: 'CREATION', entityId: 'creation-1', label: 'Robe Éternelle' }],
    });
  });

  it('GET /media/:id returns 403 for a COUTURIERE', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'couturiere-1', role: 'COUTURIERE' });

    await request(server()).get('/media/media-1').set('Authorization', 'Bearer valid-token').expect(403);
  });

  it('PATCH /media/:id updates the alt text', async () => {
    updateMediaUseCase.execute.mockResolvedValue(sampleMedia());

    const response = await request(server())
      .patch('/media/media-1')
      .set('Authorization', 'Bearer valid-token')
      .send({ altText: 'Nouveau texte alternatif' })
      .expect(200);

    expect(updateMediaUseCase.execute).toHaveBeenCalledWith('media-1', { altText: 'Nouveau texte alternatif' });
    expect(response.body).toMatchObject({ id: 'media-1' });
  });

  it('PATCH /media/:id returns 401 with no token', async () => {
    await request(server()).patch('/media/media-1').send({ altText: 'x' }).expect(401);
    expect(updateMediaUseCase.execute).not.toHaveBeenCalled();
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
