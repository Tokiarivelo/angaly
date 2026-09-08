import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { AccessTokenPayload } from '../../domain/services/access-token.service';

interface RequestWithUser {
  user?: AccessTokenPayload;
}

/** Extracted for direct unit testing — createParamDecorator() itself isn't callable outside a real request pipeline. */
export function extractCurrentUser(_data: unknown, ctx: ExecutionContext): AccessTokenPayload {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (!request.user) {
    throw new Error('CurrentUser() used outside of a route protected by JwtAuthGuard');
  }
  return request.user;
}

/** Extracts the payload `JwtAuthGuard` attached to `req.user` — only valid on routes behind that guard. */
export const CurrentUser = createParamDecorator(extractCurrentUser);
