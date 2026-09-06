import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { Locale } from '../../domain/value-objects/locale.vo';
import { DEFAULT_LOCALE } from '../../domain/value-objects/locale.vo';
import type { RequestWithLocale } from '../types/request-with-locale.type';

/** Exported unwrapped so it can be unit-tested directly (NestJS custom-decorator testing pattern). */
export function currentLocaleFactory(_data: unknown, ctx: ExecutionContext): Locale {
  const request = ctx.switchToHttp().getRequest<RequestWithLocale>();
  return request.locale ?? DEFAULT_LOCALE;
}

export const CurrentLocale = createParamDecorator(currentLocaleFactory);
