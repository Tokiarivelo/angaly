import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ACCESS_TOKEN_SERVICE } from '../../../auth/domain/services/access-token.service';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ChangeStaffRoleUseCase } from '../../application/use-cases/change-staff-role.use-case';
import { CreateStaffUserUseCase } from '../../application/use-cases/create-staff-user.use-case';
import { ListStaffUsersUseCase } from '../../application/use-cases/list-staff-users.use-case';
import { SetStaffUserStatusUseCase } from '../../application/use-cases/set-staff-user-status.use-case';
import { StaffUserEntity } from '../../domain/entities/staff-user.entity';
import { StaffUsersController } from '../../presentation/controllers/staff-users.controller';

function buildStaffUser(overrides: Partial<Parameters<typeof StaffUserEntity.create>[0]> = {}) {
  return StaffUserEntity.create({
    id: 'user-2',
    email: 'couturiere@angaly.com',
    role: 'COUTURIERE',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('StaffUsersController (integration)', () => {
  let app: INestApplication;
  const listStaffUsersUseCase = { execute: jest.fn() };
  const createStaffUserUseCase = { execute: jest.fn() };
  const changeStaffRoleUseCase = { execute: jest.fn() };
  const setStaffUserStatusUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StaffUsersController],
      providers: [
        { provide: ListStaffUsersUseCase, useValue: listStaffUsersUseCase },
        { provide: CreateStaffUserUseCase, useValue: createStaffUserUseCase },
        { provide: ChangeStaffRoleUseCase, useValue: changeStaffRoleUseCase },
        { provide: SetStaffUserStatusUseCase, useValue: setStaffUserStatusUseCase },
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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

  it('GET /admin/users returns the paginated list for an ADMIN', async () => {
    listStaffUsersUseCase.execute.mockResolvedValue({ items: [buildStaffUser()], total: 1 });

    const response = await request(server())
      .get('/admin/users')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('GET /admin/users returns 403 for a MANAGER (ADMIN-only)', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'manager-1', role: 'MANAGER' });

    await request(server())
      .get('/admin/users')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);

    expect(listStaffUsersUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /admin/users returns 403 for a CLIENT', async () => {
    accessTokenService.verify.mockReturnValue({ sub: 'client-1', role: 'CLIENT' });

    await request(server())
      .get('/admin/users')
      .set('Authorization', 'Bearer valid-token')
      .expect(403);
  });

  it('GET /admin/users returns 401 with no token', async () => {
    await request(server()).get('/admin/users').expect(401);
  });

  it('POST /admin/users creates a staff account', async () => {
    createStaffUserUseCase.execute.mockResolvedValue(buildStaffUser());

    const response = await request(server())
      .post('/admin/users')
      .set('Authorization', 'Bearer valid-token')
      .send({ email: 'couturiere@angaly.com', role: 'COUTURIERE', password: 'super-secret' })
      .expect(201);

    expect(createStaffUserUseCase.execute).toHaveBeenCalledWith({
      email: 'couturiere@angaly.com',
      role: 'COUTURIERE',
      password: 'super-secret',
    });
    expect(response.body).toMatchObject({ email: 'couturiere@angaly.com' });
  });

  it('POST /admin/users rejects role CLIENT with 400', async () => {
    await request(server())
      .post('/admin/users')
      .set('Authorization', 'Bearer valid-token')
      .send({ email: 'x@angaly.com', role: 'CLIENT', password: 'super-secret' })
      .expect(400);

    expect(createStaffUserUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /admin/users/:id/role changes the role and passes the acting admin id', async () => {
    changeStaffRoleUseCase.execute.mockResolvedValue(buildStaffUser({ role: 'MANAGER' }));

    const response = await request(server())
      .patch('/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'MANAGER' })
      .expect(200);

    expect(changeStaffRoleUseCase.execute).toHaveBeenCalledWith({
      targetUserId: 'user-2',
      role: 'MANAGER',
      actorUserId: 'admin-1',
    });
    expect(response.body).toMatchObject({ role: 'MANAGER' });
  });

  it('PATCH /admin/users/:id/status deactivates the account', async () => {
    setStaffUserStatusUseCase.execute.mockResolvedValue(buildStaffUser({ isActive: false }));

    const response = await request(server())
      .patch('/admin/users/user-2/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ isActive: false })
      .expect(200);

    expect(setStaffUserStatusUseCase.execute).toHaveBeenCalledWith({
      targetUserId: 'user-2',
      isActive: false,
      actorUserId: 'admin-1',
    });
    expect(response.body).toMatchObject({ isActive: false });
  });
});
