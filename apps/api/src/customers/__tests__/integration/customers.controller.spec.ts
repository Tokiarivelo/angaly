import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CustomerEntity } from '../../domain/entities/customer.entity';
import { GetCustomerProfileUseCase } from '../../application/use-cases/get-customer-profile.use-case';
import { UpdateCustomerProfileUseCase } from '../../application/use-cases/update-customer-profile.use-case';
import { CustomersController } from '../../presentation/controllers/customers.controller';

function sampleCustomer(): CustomerEntity {
  return CustomerEntity.create({
    id: 'customer-1',
    userId: 'user-1',
    firstName: 'Nirina',
    lastName: 'Rakoto',
    phone: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CustomersController (integration)', () => {
  let app: INestApplication;
  const getCustomerProfileUseCase = { execute: jest.fn() };
  const updateCustomerProfileUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: GetCustomerProfileUseCase, useValue: getCustomerProfileUseCase },
        { provide: UpdateCustomerProfileUseCase, useValue: updateCustomerProfileUseCase },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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

  describe('GET /customers/me', () => {
    it('returns 401 without a bearer token', async () => {
      await request(server()).get('/customers/me').expect(401);
    });

    it('returns the current user profile with a valid bearer token', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
      getCustomerProfileUseCase.execute.mockResolvedValue(sampleCustomer());

      const response = await request(server())
        .get('/customers/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const body = response.body as { id: string; firstName: string };
      expect(body.id).toBe('customer-1');
      expect(body.firstName).toBe('Nirina');
      expect(getCustomerProfileUseCase.execute).toHaveBeenCalledWith('user-1');
    });

    it('returns 404 when no profile exists for the user', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-without-profile', role: 'CLIENT' });
      getCustomerProfileUseCase.execute.mockRejectedValue(new NotFoundException('Customer profile not found'));

      await request(server()).get('/customers/me').set('Authorization', 'Bearer valid-token').expect(404);
    });
  });

  describe('PATCH /customers/me', () => {
    it('updates and returns the current user profile', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });
      updateCustomerProfileUseCase.execute.mockResolvedValue(
        CustomerEntity.create({
          id: 'customer-1',
          userId: 'user-1',
          firstName: 'Updated',
          lastName: 'Rakoto',
          phone: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      );

      const response = await request(server())
        .patch('/customers/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Updated' })
        .expect(200);

      const body = response.body as { firstName: string };
      expect(body.firstName).toBe('Updated');
      expect(updateCustomerProfileUseCase.execute).toHaveBeenCalledWith('user-1', { firstName: 'Updated' });
    });

    it('rejects an unknown field (whitelist: true)', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });

      await request(server())
        .patch('/customers/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'new@example.com' })
        .expect(400);
    });
  });
});
