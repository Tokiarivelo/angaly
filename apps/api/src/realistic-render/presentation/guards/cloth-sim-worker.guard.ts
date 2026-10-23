import { timingSafeEqual } from 'node:crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { RealisticRenderConfig } from '../../application/services/realistic-render.config';

/**
 * Only the cloth-sim worker reaches /internal/cloth-sim: `Authorization: Bearer <CLOTH_SIM_WORKER_TOKEN>`. Without
 * the variable the endpoints are off (503) rather than open.
 */
@Injectable()
export class ClothSimWorkerGuard implements CanActivate {
  constructor(private readonly config: RealisticRenderConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.workerToken;
    if (!expected) {
      throw new ServiceUnavailableException('Worker de simulation non configuré (CLOTH_SIM_WORKER_TOKEN).');
    }

    const header = context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token || !sameSecret(token, expected)) {
      throw new UnauthorizedException('Jeton du worker invalide.');
    }
    return true;
  }
}

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
