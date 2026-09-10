import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';
import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.use-case';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.use-case';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.use-case';
import { FavoritesController } from '../../presentation/controllers/favorites.controller';

function sampleFavorite(): FavoriteEntity {
  return FavoriteEntity.create({
    id: 'favorite-1',
    customerId: 'customer-1',
    entityType: 'CREATION',
    entityId: 'creation-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('FavoritesController (integration)', () => {
  let app: INestApplication;
  const listFavoritesUseCase = { execute: jest.fn() };
  const addFavoriteUseCase = { execute: jest.fn() };
  const removeFavoriteUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: ListFavoritesUseCase, useValue: listFavoritesUseCase },
        { provide: AddFavoriteUseCase, useValue: addFavoriteUseCase },
        { provide: RemoveFavoriteUseCase, useValue: removeFavoriteUseCase },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
    accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
  });

  function server(): Server {
    return app.getHttpServer() as Server;
  }

  describe('GET /favorites', () => {
    it('returns 401 without a bearer token', async () => {
      await request(server()).get('/favorites').expect(401);
    });

    it('returns the hydrated favorites list', async () => {
      listFavoritesUseCase.execute.mockResolvedValue([
        { favorite: sampleFavorite(), display: { name: 'Robe Éternelle', slug: 'robe-eternelle', imageUrl: null } },
      ]);

      const response = await request(server())
        .get('/favorites')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const body = response.body as Array<{ id: string; display: { name: string } }>;
      expect(body).toHaveLength(1);
      expect(body[0]?.display.name).toBe('Robe Éternelle');
      expect(listFavoritesUseCase.execute).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /favorites', () => {
    it('creates a favorite and returns 201', async () => {
      addFavoriteUseCase.execute.mockResolvedValue(sampleFavorite());

      const response = await request(server())
        .post('/favorites')
        .set('Authorization', 'Bearer valid-token')
        .send({ entityType: 'CREATION', entityId: 'creation-1' })
        .expect(201);

      const body = response.body as { id: string };
      expect(body.id).toBe('favorite-1');
      expect(addFavoriteUseCase.execute).toHaveBeenCalledWith('user-1', 'CREATION', 'creation-1');
    });

    it('rejects an invalid entityType (400)', async () => {
      await request(server())
        .post('/favorites')
        .set('Authorization', 'Bearer valid-token')
        .send({ entityType: 'NOT_A_TYPE', entityId: 'creation-1' })
        .expect(400);
    });
  });

  describe('DELETE /favorites/:id', () => {
    it('deletes the favorite and returns 204', async () => {
      removeFavoriteUseCase.execute.mockResolvedValue(undefined);

      await request(server()).delete('/favorites/favorite-1').set('Authorization', 'Bearer valid-token').expect(204);

      expect(removeFavoriteUseCase.execute).toHaveBeenCalledWith('user-1', 'favorite-1');
    });

    it('returns 403 when the favorite belongs to another customer', async () => {
      removeFavoriteUseCase.execute.mockRejectedValue(new ForbiddenException());

      await request(server()).delete('/favorites/favorite-1').set('Authorization', 'Bearer valid-token').expect(403);
    });

    it('returns 404 when the favorite does not exist', async () => {
      removeFavoriteUseCase.execute.mockRejectedValue(new NotFoundException());

      await request(server()).delete('/favorites/missing-id').set('Authorization', 'Bearer valid-token').expect(404);
    });
  });
});
