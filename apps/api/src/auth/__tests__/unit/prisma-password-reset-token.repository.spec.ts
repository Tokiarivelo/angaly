import { PrismaPasswordResetTokenRepository } from '../../infrastructure/repositories/prisma-password-reset-token.repository';
import type { PrismaService } from '../../../prisma/prisma.service';

interface MockDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
}

function buildPrismaServiceMock(): { prisma: PrismaService; passwordResetToken: MockDelegate } {
  const passwordResetToken: MockDelegate = { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() };
  const prisma = { passwordResetToken } as unknown as PrismaService;
  return { prisma, passwordResetToken };
}

describe('PrismaPasswordResetTokenRepository', () => {
  it('create() inserts a row', async () => {
    const { prisma, passwordResetToken } = buildPrismaServiceMock();
    const expiresAt = new Date('2026-01-01T01:00:00.000Z');

    await new PrismaPasswordResetTokenRepository(prisma).create({ userId: 'user-1', tokenHash: 'hash', expiresAt });

    expect(passwordResetToken.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', tokenHash: 'hash', expiresAt },
    });
  });

  it('findByTokenHash() returns null when no row matches', async () => {
    const { prisma, passwordResetToken } = buildPrismaServiceMock();
    passwordResetToken.findUnique.mockResolvedValue(null);

    expect(await new PrismaPasswordResetTokenRepository(prisma).findByTokenHash('hash')).toBeNull();
  });

  it('markUsed() sets usedAt', async () => {
    const { prisma, passwordResetToken } = buildPrismaServiceMock();

    await new PrismaPasswordResetTokenRepository(prisma).markUsed('reset-1');

    expect(passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
      data: { usedAt: expect.any(Date) as Date },
    });
  });
});
