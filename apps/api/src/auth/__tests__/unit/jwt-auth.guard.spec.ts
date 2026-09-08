import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';
import type { IAccessTokenService } from '../../domain/services/access-token.service';

function buildContext(headers: Record<string, string | undefined>): ExecutionContext {
  const request = { headers, user: undefined } as { headers: typeof headers; user?: unknown };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('rejects a request with no Authorization header', () => {
    const accessTokenService: jest.Mocked<IAccessTokenService> = { sign: jest.fn(), verify: jest.fn() };
    const guard = new JwtAuthGuard(accessTokenService);

    expect(() => guard.canActivate(buildContext({}))).toThrow(new UnauthorizedException('Missing bearer token'));
  });

  it('rejects a non-Bearer Authorization header', () => {
    const accessTokenService: jest.Mocked<IAccessTokenService> = { sign: jest.fn(), verify: jest.fn() };
    const guard = new JwtAuthGuard(accessTokenService);

    expect(() => guard.canActivate(buildContext({ authorization: 'Basic xyz' }))).toThrow(
      'Missing bearer token',
    );
  });

  it('rejects a token that fails verification', () => {
    const accessTokenService: jest.Mocked<IAccessTokenService> = { sign: jest.fn(), verify: jest.fn().mockReturnValue(null) };
    const guard = new JwtAuthGuard(accessTokenService);

    expect(() => guard.canActivate(buildContext({ authorization: 'Bearer bad-token' }))).toThrow(
      'Invalid or expired access token',
    );
  });

  it('attaches the verified payload to req.user and allows the request through', () => {
    const payload = { sub: 'user-1', role: 'CLIENT' as const };
    const accessTokenService: jest.Mocked<IAccessTokenService> = {
      sign: jest.fn(),
      verify: jest.fn().mockReturnValue(payload),
    };
    const guard = new JwtAuthGuard(accessTokenService);
    const context = buildContext({ authorization: 'Bearer good-token' });

    expect(guard.canActivate(context)).toBe(true);
    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    expect(request.user).toEqual(payload);
    expect(accessTokenService.verify).toHaveBeenCalledWith('good-token');
  });
});
