import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import { ResolveRequestLocaleUseCase } from '../../application/use-cases/resolve-request-locale.use-case';
import type { RequestWithLocale } from '../types/request-with-locale.type';

function toSingleString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Attaches the resolved Locale to `req.locale`, consumed via @CurrentLocale(). */
@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private readonly resolveRequestLocaleUseCase: ResolveRequestLocaleUseCase) {}

  use(req: RequestWithLocale, _res: Response, next: NextFunction): void {
    req.locale = this.resolveRequestLocaleUseCase.execute({
      queryLocale: toSingleString(req.query['locale']),
      cookieLocale: toSingleString((req.cookies as Record<string, unknown> | undefined)?.['locale']),
      acceptLanguageHeader: req.headers['accept-language'],
    });
    next();
  }
}
