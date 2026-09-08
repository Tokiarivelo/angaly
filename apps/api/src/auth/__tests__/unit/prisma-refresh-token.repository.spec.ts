import { PrismaRefreshTokenRepository } from '../../infrastructure/repositories/prisma-refresh-token.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; refreshToken: MockDelegate } {
  const refreshToken: MockDelegate = { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
  const prisma = { refreshToken } as unknown as PrismaService;
  return { prisma, refreshToken };
}

describe('PrismaRefreshTokenRepository', () => {
  it('create() inserts a row', async () => {
    const { prisma, refreshToken } = buildPrismaServiceMock();
    const expiresAt = new Date('2026-01-08T00:00:00.000Z');

    await new PrismaRefreshTokenRepository(prisma).create({ userId: 'user-1', tokenHash: 'hash', expiresAt });

    expect(refreshToken.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', tokenHash: 'hash', expiresAt },
    });
  });

  it('findByTokenHash() returns null when no row matches', async () => {
    const { prisma, refreshToken } = buildPrismaServiceMock();
    refreshToken.findUnique.mockResolvedValue(null);

    expect(await new PrismaRefreshTokenRepository(prisma).findByTokenHash('hash')).toBeNull();
  });

  it('revoke() sets revokedAt', async () => {
    const { prisma, refreshToken } = buildPrismaServiceMock();

    await new PrismaRefreshTokenRepository(prisma).revoke('token-1');

    expect(refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'token-1' },
      data: { revokedAt: expect.any(Date) as Date },
    });
  });
});
