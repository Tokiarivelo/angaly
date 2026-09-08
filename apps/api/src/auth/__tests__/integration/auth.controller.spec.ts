import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { BadRequestException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user.use-case';
import { RefreshAccessTokenUseCase } from '../../application/use-cases/refresh-access-token.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import { ACCESS_TOKEN_SERVICE } from '../../domain/services/access-token.service';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';

function sampleUser(): UserEntity {
  return UserEntity.create({
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hashed',
    role: 'CLIENT',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('AuthController (integration)', () => {
  let app: INestApplication;
  const registerUserUseCase = { execute: jest.fn() };
  const loginUserUseCase = { execute: jest.fn() };
  const refreshAccessTokenUseCase = { execute: jest.fn() };
  const logoutUserUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const accessTokenService = { sign: jest.fn(), verify: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUserUseCase },
        { provide: LoginUserUseCase, useValue: loginUserUseCase },
        { provide: RefreshAccessTokenUseCase, useValue: refreshAccessTokenUseCase },
        { provide: LogoutUserUseCase, useValue: logoutUserUseCase },
        { provide: RequestPasswordResetUseCase, useValue: requestPasswordResetUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        JwtAuthGuard,
        { provide: ACCESS_TOKEN_SERVICE, useValue: accessTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
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

  describe('POST /auth/register', () => {
    it('creates the session, returns 201, and sets an httpOnly refresh cookie', async () => {
      registerUserUseCase.execute.mockResolvedValue({
        user: sampleUser(),
        accessToken: 'access-token',
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: new Date(Date.now() + 60_000),
      });

      const response = await request(server())
        .post('/auth/register')
        .send({ email: 'client@example.com', password: 'password123', firstName: 'Jean', lastName: 'Rakoto' })
        .expect(201);

      const body = response.body as { accessToken: string; user: { email: string } };
      expect(body.accessToken).toBe('access-token');
      expect(body.user.email).toBe('client@example.com');

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/api/auth');
    });

    it('rejects a request missing required fields with 400', async () => {
      await request(server()).post('/auth/register').send({ email: 'client@example.com' }).expect(400);
    });

    it('rejects a short password with 400', async () => {
      await request(server())
        .post('/auth/register')
        .send({ email: 'client@example.com', password: 'short', firstName: 'Jean', lastName: 'Rakoto' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns 200 with an access token and sets the refresh cookie', async () => {
      loginUserUseCase.execute.mockResolvedValue({
        user: sampleUser(),
        accessToken: 'access-token',
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: new Date(Date.now() + 60_000),
      });

      const response = await request(server())
        .post('/auth/login')
        .send({ email: 'client@example.com', password: 'password123' })
        .expect(200);

      expect(loginUserUseCase.execute).toHaveBeenCalledWith('client@example.com', 'password123');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refresh_token=raw-refresh-token'))).toBe(true);
    });

    it('returns 401 for invalid credentials', async () => {
      loginUserUseCase.execute.mockRejectedValue(new UnauthorizedException('Invalid email or password'));

      await request(server())
        .post('/auth/login')
        .send({ email: 'client@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the cookie and returns a new access token when a valid cookie is presented', async () => {
      refreshAccessTokenUseCase.execute.mockResolvedValue({
        user: sampleUser(),
        accessToken: 'new-access-token',
        refreshToken: 'new-raw-refresh-token',
        refreshTokenExpiresAt: new Date(Date.now() + 60_000),
      });

      const response = await request(server())
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=old-raw-refresh-token'])
        .expect(200);

      expect(refreshAccessTokenUseCase.execute).toHaveBeenCalledWith('old-raw-refresh-token');
      const body = response.body as { accessToken: string };
      expect(body.accessToken).toBe('new-access-token');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refresh_token=new-raw-refresh-token'))).toBe(true);
    });

    it('returns 401 and clears the cookie when no refresh cookie is presented', async () => {
      const response = await request(server()).post('/auth/refresh').expect(401);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      // clearCookie sets an already-expired cookie with the same name.
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
      expect(refreshAccessTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 401 when the use-case rejects an invalid/expired token', async () => {
      refreshAccessTokenUseCase.execute.mockRejectedValue(new UnauthorizedException('Invalid or expired refresh token'));

      await request(server()).post('/auth/refresh').set('Cookie', ['refresh_token=stale']).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('requires a valid access token (JwtAuthGuard)', async () => {
      accessTokenService.verify.mockReturnValue(null);

      await request(server()).post('/auth/logout').expect(401);
      expect(logoutUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('revokes the refresh token and clears the cookie when authenticated', async () => {
      accessTokenService.verify.mockReturnValue({ sub: 'user-1', role: 'CLIENT' });

      const response = await request(server())
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .set('Cookie', ['refresh_token=raw-refresh-token'])
        .expect(204);

      expect(logoutUserUseCase.execute).toHaveBeenCalledWith('raw-refresh-token');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('always returns 200 with the same generic message', async () => {
      requestPasswordResetUseCase.execute.mockResolvedValue(undefined);

      const response = await request(server())
        .post('/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(200);

      expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith('nobody@example.com');
      expect((response.body as { message: string }).message).toMatch(/reset link/i);
    });

    it('rejects a malformed email with 400', async () => {
      await request(server()).post('/auth/forgot-password').send({ email: 'not-an-email' }).expect(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('returns 200 on success', async () => {
      resetPasswordUseCase.execute.mockResolvedValue(undefined);

      await request(server())
        .post('/auth/reset-password')
        .send({ token: 'raw-token', newPassword: 'newpassword123' })
        .expect(200);

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith('raw-token', 'newpassword123');
    });

    it('returns 400 when the use-case rejects an invalid token', async () => {
      resetPasswordUseCase.execute.mockRejectedValue(new BadRequestException('Invalid or expired reset token'));

      await request(server())
        .post('/auth/reset-password')
        .send({ token: 'bad-token', newPassword: 'newpassword123' })
        .expect(400);
    });

    it('rejects a short new password with 400', async () => {
      await request(server())
        .post('/auth/reset-password')
        .send({ token: 'raw-token', newPassword: 'short' })
        .expect(400);
    });
  });
});
