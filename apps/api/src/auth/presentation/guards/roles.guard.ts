import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { AccessTokenPayload } from '../../domain/services/access-token.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: AccessTokenPayload;
}

/**
 * Reads @Roles(...) metadata and checks it against req.user.role — must run
 * AFTER JwtAuthGuard (`@UseGuards(JwtAuthGuard, RolesGuard)`), which is what
 * populates req.user. A route with no @Roles() decorator is allowed through
 * (role-agnostic, same as not using this guard at all).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }

    return true;
  }
}
