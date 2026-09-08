import type { ExecutionContext } from '@nestjs/common';

import { extractCurrentUser } from '../../presentation/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../../domain/services/access-token.service';

function buildContext(user?: AccessTokenPayload): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('extractCurrentUser', () => {
  it('returns the payload JwtAuthGuard attached to req.user', () => {
    const payload: AccessTokenPayload = { sub: 'user-1', role: 'CLIENT' };
    expect(extractCurrentUser(undefined, buildContext(payload))).toEqual(payload);
  });

  it('throws when used outside a route protected by JwtAuthGuard', () => {
    expect(() => extractCurrentUser(undefined, buildContext(undefined))).toThrow(
      'CurrentUser() used outside of a route protected by JwtAuthGuard',
    );
  });
});
