import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { RolesGuard } from '../../presentation/guards/roles.guard';

function buildContext(user: { sub: string; role: string } | undefined): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function buildReflector(requiredRoles: string[] | undefined): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows the request through when the route has no @Roles() metadata', () => {
    const guard = new RolesGuard(buildReflector(undefined));

    expect(guard.canActivate(buildContext({ sub: 'user-1', role: 'CLIENT' }))).toBe(true);
  });

  it('allows the request through when req.user.role is in the required list', () => {
    const guard = new RolesGuard(buildReflector(['COUTURIERE', 'MANAGER', 'ADMIN']));

    expect(guard.canActivate(buildContext({ sub: 'user-1', role: 'MANAGER' }))).toBe(true);
  });

  it('rejects when req.user.role is not in the required list', () => {
    const guard = new RolesGuard(buildReflector(['COUTURIERE', 'MANAGER', 'ADMIN']));

    expect(() => guard.canActivate(buildContext({ sub: 'user-1', role: 'CLIENT' }))).toThrow(ForbiddenException);
  });

  it('rejects when there is no req.user at all (JwtAuthGuard did not run first)', () => {
    const guard = new RolesGuard(buildReflector(['ADMIN']));

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});
